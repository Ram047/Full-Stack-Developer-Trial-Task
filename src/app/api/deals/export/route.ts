import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const sessionInfo = await getSession();
  if (!sessionInfo) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') || 'csv';
  const search = searchParams.get('q') || '';
  const stage = searchParams.get('stage') || '';
  const minVal = parseFloat(searchParams.get('minVal') || '') || undefined;
  const maxVal = parseFloat(searchParams.get('maxVal') || '') || undefined;

  // Build filters
  const whereCondition: any = {
    deletedAt: null,
  };

  if (search) {
    whereCondition.OR = [
      { title: { contains: search } },
      { company: { name: { contains: search } } },
      { contact: { name: { contains: search } } },
    ];
  }

  if (stage) {
    whereCondition.stage = stage;
  }

  if (minVal !== undefined || maxVal !== undefined) {
    whereCondition.value = {};
    if (minVal !== undefined) whereCondition.value.gte = minVal;
    if (maxVal !== undefined) whereCondition.value.lte = maxVal;
  }

  try {
    if (format === 'csv') {
      const encoder = new TextEncoder();
      
      // Stream CSV response
      const stream = new ReadableStream({
        async start(controller) {
          // Write CSV Header
          controller.enqueue(encoder.encode("ID,Title,Value,Stage,Probability (%),Expected Close Date,Company,Contact,Owner,Created At\n"));

          let skip = 0;
          const batchSize = 100;
          let hasMore = true;

          while (hasMore) {
            const deals = await prisma.deal.findMany({
              where: whereCondition,
              orderBy: { createdAt: 'desc' },
              take: batchSize,
              skip: skip,
              include: {
                company: { select: { name: true } },
                contact: { select: { name: true } },
                owner: { select: { name: true } },
              },
            });

            if (deals.length === 0) {
              hasMore = false;
              break;
            }

            for (const deal of deals) {
              const row = [
                deal.id,
                `"${deal.title.replace(/"/g, '""')}"`,
                deal.value,
                deal.stage,
                deal.probability,
                deal.expectedCloseDate ? deal.expectedCloseDate.toISOString().split('T')[0] : '',
                deal.company ? `"${deal.company.name.replace(/"/g, '""')}"` : '',
                deal.contact ? `"${deal.contact.name.replace(/"/g, '""')}"` : '',
                deal.owner.name,
                deal.createdAt.toISOString(),
              ].join(',') + '\n';

              controller.enqueue(encoder.encode(row));
            }

            skip += batchSize;
            if (deals.length < batchSize) {
              hasMore = false;
            }
          }

          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="deals-export.csv"',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Default response if format parameter is unrecognized
    return new Response('Format not supported', { status: 400 });
  } catch (error) {
    console.error('Export error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
