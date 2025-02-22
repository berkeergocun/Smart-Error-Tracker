import { Elysia } from 'elysia';
import { ErrorGroup } from '../models/ErrorGroup';
import { ErrorModel } from '../models/Error';
import { analyzeError } from '../services/aiService';

export const groupsRouter = new Elysia({ prefix: '/api/groups' })
  .get('/', async ({ query }) => {
    const {
      page = '1',
      limit = '20',
      domainId,
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
    if (type) filter.type = type;
    if (severity) filter.severity = severity;
    if (resolved !== undefined) filter.resolved = resolved === 'true';
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'sampleError.message': { $regex: search, $options: 'i' } },
      ];
    }

    const [groups, total] = await Promise.all([
      ErrorGroup.find(filter)
        .sort({ lastSeen: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ErrorGroup.countDocuments(filter),
    ]);

    return {
      success: true,
      data: groups,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  })

  .get('/:id', async ({ params, error }) => {
    const group = await ErrorGroup.findById(params.id).lean();
    if (!group) return error(404, { success: false, message: 'Grup bulunamadı' });

    const errors = await ErrorModel.find({ groupId: params.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return { success: true, data: { group, errors } };
  })

  .patch('/:id/resolve', async ({ params, error }) => {
    const group = await ErrorGroup.findByIdAndUpdate(
      params.id,
      { $set: { resolved: true, resolvedAt: new Date() } },
      { new: true }
    );
    if (!group) return error(404, { success: false, message: 'Grup bulunamadı' });

    await ErrorModel.updateMany({ groupId: params.id }, { $set: { resolved: true } });

    return { success: true, data: group };
  })

  .post('/:id/analyze', async ({ params, error }) => {
    const group = await ErrorGroup.findById(params.id);
    if (!group) return error(404, { success: false, message: 'Grup bulunamadı' });

    const sampleError = await ErrorModel.findOne({ groupId: params.id })
      .sort({ createdAt: -1 })
      .lean();

    const analysis = await analyzeError({
      message: group.sampleError.message || group.title,
      type: group.type,
      stack: sampleError?.stack,
      source: group.sampleError.source,
      url: group.sampleError.url,
      count: group.count,
    });

    group.aiAnalysis = analysis;
    await group.save();

    return { success: true, data: { group, analysis } };
  });
