echo "start docker build!"

npm run build
#build docker image
docker build -t cqupt_login:latest .

echo "build image success!"

#docker build
docker run -p 8081:8081 cqupt_login:latest

echo "cqupt_login start!"
