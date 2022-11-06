# Скрипт для остановки серверной части poST-IDE
kill `ps -eaf | grep 'theia start' | grep node | awk '{print $2}'`
