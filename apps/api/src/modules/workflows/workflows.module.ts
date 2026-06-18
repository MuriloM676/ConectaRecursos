import { Module } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { WorkflowsController, ApprovalsController } from './workflows.controller';

@Module({
  controllers: [WorkflowsController, ApprovalsController],
  providers: [WorkflowsService],
  exports: [WorkflowsService],
})
export class WorkflowsModule {}
