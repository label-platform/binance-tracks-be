docker rm -f tracks-be_db_1
rm -Rf ./db/* 
rm -Rf libs/l2e-queries/src/migrations/*
docker-compose up -d
sleep 60
npm run migration:generate renew-migrations-prod
npm run migration:run
