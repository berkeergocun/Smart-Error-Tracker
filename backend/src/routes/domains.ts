import { Elysia, t } from 'elysia';
import { v4 as uuidv4 } from 'uuid';
import { Domain } from '../models/Domain';

export const domainsRouter = new Elysia({ prefix: '/api/domains' })
  .get('/', async ({ query }) => {
    const { page = '1', limit = '20', search } = query as {
      page?: string;
      limit?: string;
      search?: string;
    };

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { domain: { $regex: search, $options: 'i' } },
      ];
    }

    const [domains, total] = await Promise.all([
      Domain.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Domain.countDocuments(filter),
    ]);

    return {
      success: true,
      data: domains,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  })

  .get('/:uuid', async ({ params, error }) => {
    const domain = await Domain.findOne({ uuid: params.uuid }).lean();
    if (!domain) return error(404, { success: false, message: 'Domain bulunamadı' });
    return { success: true, data: domain };
  })

  .post(
    '/',
    async ({ body, error }) => {
      const { name, domain, description, allowedOrigins } = body as {
        name: string;
        domain: string;
        description?: string;
        allowedOrigins?: string[];
      };

      const existing = await Domain.findOne({ domain });
      if (existing) {
        return error(409, {
          success: false,
          message: 'Bu domain zaten kayıtlı',
          data: existing,
        });
      }

      const uuid = uuidv4();
      const newDomain = await Domain.create({
        uuid,
        name,
        domain,
        description,
        allowedOrigins: allowedOrigins || ['*'],
      });

      return {
        success: true,
        message: 'Domain başarıyla oluşturuldu',
        data: newDomain,
      };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        domain: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        allowedOrigins: t.Optional(t.Array(t.String())),
      }),
    }
  )

  .patch(
    '/:uuid',
    async ({ params, body, error }) => {
      const domain = await Domain.findOneAndUpdate(
        { uuid: params.uuid },
        { $set: body },
        { new: true }
      );
      if (!domain) return error(404, { success: false, message: 'Domain bulunamadı' });
      return { success: true, data: domain };
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
        allowedOrigins: t.Optional(t.Array(t.String())),
        settings: t.Optional(
          t.Object({
            captureErrors: t.Optional(t.Boolean()),
            capturePerformance: t.Optional(t.Boolean()),
            sampleRate: t.Optional(t.Number()),
          })
        ),
      }),
    }
  )

  .delete('/:uuid', async ({ params, error }) => {
    const domain = await Domain.findOneAndDelete({ uuid: params.uuid });
    if (!domain) return error(404, { success: false, message: 'Domain bulunamadı' });
    return { success: true, message: 'Domain silindi' };
  });
