import { MigrationInterface, QueryRunner } from "typeorm";

export class update1671261603091 implements MigrationInterface {
    name = 'update1671261603091'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`merchandise\` (\`item_id\` int NOT NULL, \`description\` text NULL, UNIQUE INDEX \`REL_8387d70add2da169ec05b5c52d\` (\`item_id\`), PRIMARY KEY (\`item_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`tickets\` (\`item_id\` int NOT NULL, \`description\` text NULL, UNIQUE INDEX \`REL_728cdfe8d8ce62ceea053e75f1\` (\`item_id\`), PRIMARY KEY (\`item_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`activation_code_id\` \`activation_code_id\` int(11) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`wallet_address\` \`wallet_address\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`items\` CHANGE \`type\` \`type\` enum ('PINBALLHEAD', 'HEADPHONE', 'HEADPHONEBOX', 'STICKER', 'MYSTERYBOX', 'TICKET', 'MERCHANDISE') NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`login_sessions\` CHANGE \`user_id\` \`user_id\` int(11) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`listen_histories\` CHANGE \`user_id\` \`user_id\` int(11) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`listen_histories\` CHANGE \`song_id\` \`song_id\` int(11) NULL`);
        await queryRunner.query(`ALTER TABLE \`listen_histories\` CHANGE \`headphone_id\` \`headphone_id\` int(11) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`sale_histories\` CHANGE \`type\` \`type\` enum ('PINBALLHEAD', 'HEADPHONE', 'HEADPHONEBOX', 'STICKER', 'MYSTERYBOX', 'TICKET', 'MERCHANDISE') NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`spending_balances\` CHANGE \`token_decimal\` \`token_decimal\` int(2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`merchandise\` ADD CONSTRAINT \`FK_8387d70add2da169ec05b5c52d4\` FOREIGN KEY (\`item_id\`) REFERENCES \`items\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tickets\` ADD CONSTRAINT \`FK_728cdfe8d8ce62ceea053e75f18\` FOREIGN KEY (\`item_id\`) REFERENCES \`items\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tickets\` DROP FOREIGN KEY \`FK_728cdfe8d8ce62ceea053e75f18\``);
        await queryRunner.query(`ALTER TABLE \`merchandise\` DROP FOREIGN KEY \`FK_8387d70add2da169ec05b5c52d4\``);
        await queryRunner.query(`ALTER TABLE \`spending_balances\` CHANGE \`token_decimal\` \`token_decimal\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`sale_histories\` CHANGE \`type\` \`type\` enum ('PINBALLHEAD', 'HEADPHONE', 'HEADPHONEBOX', 'STICKER', 'MYSTERYBOX') NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`listen_histories\` CHANGE \`headphone_id\` \`headphone_id\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`listen_histories\` CHANGE \`song_id\` \`song_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`listen_histories\` CHANGE \`user_id\` \`user_id\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`login_sessions\` CHANGE \`user_id\` \`user_id\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`items\` CHANGE \`type\` \`type\` enum ('PINBALLHEAD', 'HEADPHONE', 'HEADPHONEBOX', 'STICKER', 'MYSTERYBOX') NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`wallet_address\` \`wallet_address\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`activation_code_id\` \`activation_code_id\` int NULL`);
        await queryRunner.query(`DROP INDEX \`REL_728cdfe8d8ce62ceea053e75f1\` ON \`tickets\``);
        await queryRunner.query(`DROP TABLE \`tickets\``);
        await queryRunner.query(`DROP INDEX \`REL_8387d70add2da169ec05b5c52d\` ON \`merchandise\``);
        await queryRunner.query(`DROP TABLE \`merchandise\``);
    }

}
