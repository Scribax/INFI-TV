import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { buildPagination } from "@infitv/utils";
import type { Paginated } from "@infitv/types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { PrismaService } from "../common/prisma/prisma.service";
import { AuditQueryDto } from "./dto/audit-query.dto";

@ApiTags("admin-audit")
@Controller("admin/audit-logs")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles("SUPER_ADMIN")
  @ApiOperation({ summary: "Lista auditoría (solo SUPER_ADMIN)" })
  async list(@Query() q: AuditQueryDto): Promise<Paginated<unknown>> {
    const where = q.action === undefined ? {} : { action: q.action };
    const total = await this.prisma.auditLog.count({ where });
    const p = buildPagination({
      page: q.page ?? 1,
      pageSize: q.pageSize ?? 20,
      total,
    });
    const items = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: p.offset,
      take: p.pageSize,
    });
    return {
      items,
      page: p.page,
      pageSize: p.pageSize,
      total: p.total,
      totalPages: p.totalPages,
    };
  }
}
