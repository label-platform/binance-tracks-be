docker rm -f tracks-be_testdb_1
rm -Rf ./db-test/* 
rm -Rf libs/l2e-queries/src/migrations/*
docker-compose up -d
sleep 60
npm run migration:generate:test renew-migrations
npm run migration:run:test
