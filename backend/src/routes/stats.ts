import { Elysia } from 'elysia';
import { ErrorModel } from '../models/Error';
import { ErrorGroup } from '../models/ErrorGroup';
import { Domain } from '../models/Domain';

export const statsRouter = new Elysia({ prefix: '/api/stats' })
  .get('/', async ({ query }) => {
    const { domainId } = query as { domainId?: string };
    const filter: Record<string, unknown> = {};
    if (domainId) filter.domainId = domainId;

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalErrors,
      totalGroups,
      totalDomains,
      openGroups,
      errorsLast24h,
      errorsLast7d,
      byType,
      bySeverity,
      recentErrors,
      topGroups,
    ] = await Promise.all([
      ErrorModel.countDocuments(filter),
      ErrorGroup.countDocuments(filter),
      Domain.countDocuments(),
      ErrorGroup.countDocuments({ ...filter, resolved: false }),
      ErrorModel.countDocuments({ ...filter, createdAt: { $gte: last24h } }),
      ErrorModel.countDocuments({ ...filter, createdAt: { $gte: last7d } }),
      ErrorModel.aggregate([
        { $match: filter },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      ErrorModel.aggregate([
        { $match: filter },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      ErrorModel.find(filter)
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      ErrorGroup.find({ ...filter, resolved: false })
        .sort({ count: -1 })
        .limit(5)
        .lean(),
    ]);

    // Son 7 günün hata trendi
    const trendPipeline = [
      {
        $match: {
          ...filter,
          createdAt: { $gte: last7d },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const trend = await ErrorModel.aggregate(trendPipeline);

    return {
      success: true,
      data: {
        overview: {
          totalErrors,
          totalGroups,
          totalDomains,
          openGroups,
          errorsLast24h,
          errorsLast7d,
        },
        byType: byType.map((b) => ({ type: b._id, count: b.count })),
        bySeverity: bySeverity.map((b) => ({ severity: b._id, count: b.count })),
        trend: trend.map((t) => ({ date: t._id, count: t.count })),
        recentErrors,
        topGroups,
      },
    };
  });
