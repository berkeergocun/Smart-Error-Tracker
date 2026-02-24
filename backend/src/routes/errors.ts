import { Elysia, t } from 'elysia';
import { ErrorModel } from '../models/Error';
import { ErrorGroup } from '../models/ErrorGroup';
import { Domain } from '../models/Domain';
import { generateFingerprint, generateTitle } from '../services/fingerprintService';
import { analyzeError } from '../services/aiService';

export const errorsRouter = new Elysia({ prefix: '/api/errors' })
  // Hata listesi
  .get('/', async ({ query }) => {
    const {
      page = '1',
      limit = '20',
      domainId,
      groupId,
      type,
      severity,
      resolved,
      search,
    } = query as Record<string, string>;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, unknown> = {};
    if (domainId) filter.domainId = domainId;
    if (groupId) filter.groupId = groupId;
    if (type) filter.type = type;
    if (severity) filter.severity = severity;
    if (resolved !== undefined) filter.resolved = resolved === 'true';
    if (search) filter.message = { $regex: search, $options: 'i' };

    const [errors, total] = await Promise.all([
      ErrorModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ErrorModel.countDocuments(filter),
    ]);

    return {
      success: true,
      data: errors,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  })

  // Tekil hata
  .get('/:id', async ({ params, error }) => {
    const err = await ErrorModel.findById(params.id).lean();
    if (!err) return error(404, { success: false, message: 'Hata bulunamadı' });
    return { success: true, data: err };
  })

  // Hata gönder (SDK kullanır)
  .post(
    '/ingest',
    async ({ body, headers, query, error }) => {
      // UUID: önce header, sonra query param (sendBeacon için)
      const domainId = headers['x-domain-id']
        || (query as Record<string, string>).uuid
        || (body as Record<string, string>).domainId;

      if (!domainId) {
        return error(401, { success: false, message: 'Domain ID gerekli (x-domain-id header)' });
      }

      // Domain doğrula
      const domain = await Domain.findOne({ uuid: domainId });
      if (!domain) {
        return error(401, { success: false, message: 'Geçersiz Domain ID' });
      }

      const {
        message,
        type = 'javascript',
        severity = 'medium',
        stack,
        source,
        lineno,
        colno,
        url,
        userAgent,
        metadata = {},
        breadcrumbs = [],
      } = body as {
        message: string;
        type?: string;
        severity?: string;
        stack?: string;
        source?: string;
        lineno?: number;
        colno?: number;
        url?: string;
        userAgent?: string;
        metadata?: Record<string, unknown>;
        breadcrumbs?: Array<{
          type: string;
          message: string;
          timestamp: string;
          data?: Record<string, unknown>;
        }>;
        domainId?: string;
      };

      const fingerprint = generateFingerprint(
        { message, type, source, stack, lineno, colno },
        domainId
      );

      const now = new Date();

      // ErrorGroup upsert
      const group = await ErrorGroup.findOneAndUpdate(
        { fingerprint },
        {
          $setOnInsert: {
            domainId,
            fingerprint,
            title: generateTitle(message),
            type,
            firstSeen: now,
            sampleError: { message, stack, url, source },
          },
          $set: { lastSeen: now, severity },
          $inc: { count: 1 },
        },
        { upsert: true, new: true }
      );

      // Hata kaydet
      const newError = await ErrorModel.create({
        domainId,
        groupId: group._id.toString(),
        fingerprint,
        type,
        severity,
        message,
        stack,
        source,
        lineno,
        colno,
        url,
        userAgent,
        metadata,
        breadcrumbs: breadcrumbs.map((b) => ({ ...b, timestamp: new Date(b.timestamp) })),
      });

      // Domain istatistiklerini güncelle
      await Domain.updateOne(
        { uuid: domainId },
        {
          $inc: { 'stats.totalErrors': 1 },
          $set: { 'stats.lastErrorAt': now },
        }
      );

      return {
        success: true,
        message: 'Hata alındı',
        data: { id: newError._id, groupId: group._id, fingerprint },
      };
    },
    {
      body: t.Object({
        message: t.String({ minLength: 1 }),
        domainId: t.Optional(t.String()),
        type: t.Optional(t.String()),
        severity: t.Optional(t.String()),
        stack: t.Optional(t.String()),
        source: t.Optional(t.String()),
        lineno: t.Optional(t.Number()),
        colno: t.Optional(t.Number()),
        url: t.Optional(t.String()),
        userAgent: t.Optional(t.String()),
        metadata: t.Optional(t.Record(t.String(), t.Unknown())),
        breadcrumbs: t.Optional(
          t.Array(
            t.Object({
              type: t.String(),
              message: t.String(),
              timestamp: t.String(),
              data: t.Optional(t.Record(t.String(), t.Unknown())),
            })
          )
        ),
      }),
    }
  )

  // Hatayı çözüldü olarak işaretle
  .patch('/:id/resolve', async ({ params, error }) => {
    const err = await ErrorModel.findByIdAndUpdate(
      params.id,
      { $set: { resolved: true } },
      { new: true }
    );
    if (!err) return error(404, { success: false, message: 'Hata bulunamadı' });
    return { success: true, data: err };
  })

  // AI analizi
  .post('/analyze/:id', async ({ params, error }) => {
    const err = await ErrorModel.findById(params.id);
    if (!err) return error(404, { success: false, message: 'Hata bulunamadı' });

    const group = await ErrorGroup.findById(err.groupId);
    const analysis = await analyzeError({
      message: err.message,
      type: err.type,
      stack: err.stack,
      source: err.source,
      url: err.url,
      lineno: err.lineno,
      colno: err.colno,
      count: group?.count,
      userAgent: err.userAgent,
    });

    err.aiAnalysis = analysis;
    await err.save();

    if (group) {
      group.aiAnalysis = analysis;
      await group.save();
    }

    return { success: true, data: { error: err, analysis } };
  });
