import { DynamicModule, Global, Module } from '@nestjs/common';
import { EMAIL_CONFIG_OPTIONS } from '@emails/email.constant';
import { MailModuleOptions } from '@emails/email.interface';
import { EmailService } from '@emails/email.service';

@Module({})
@Global()
export class EmailModule {
  static forRoot(options: MailModuleOptions): DynamicModule {
    return {
      module: EmailModule,
      providers: [
        {
          provide: EMAIL_CONFIG_OPTIONS,
          useValue: options,
        },
        EmailService,
      ],
      exports: [EmailService],
    };
  }
}
