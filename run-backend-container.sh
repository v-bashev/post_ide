# Скрипт для запуска контейнера с серверной частью poST-IDE
# Аргументы:
#   1: порт, который конейнер будет слушать
if [ -z "$1" ]
  then
    echo "Please, specify the port to listen. Example:
$0 3000"
  else
    if [ "$(docker ps -q -f name=postide)" ]
      then
    	  echo "poST IDE container already running"
    	else
    	  if [ "$(docker ps -aq -f status=exited -f name=poST-IDE)" ]
    	    then
    	      echo "Deleting old poST-IDE container..."
    	      docker rm postide
    	  fi
    	  echo "Starting new postide container..."
    	  docker run --name postide -dp $1:3000 postide
    	  echo "poST-IDE container is running in the background. You can see its logs by executing:
sudo docker logs postIDE
См. https://docs.docker.com/engine/reference/commandline/container_logs/"
    fi
fi
