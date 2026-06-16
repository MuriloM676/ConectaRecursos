import { PartialType } from '@nestjs/swagger';
import { CreateParliamentarianDto } from './create-parliamentarian.dto';

export class UpdateParliamentarianDto extends PartialType(CreateParliamentarianDto) {}
