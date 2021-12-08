# post_ide
Theia-Based IDE for the poST language (desktop / web)
## References
- Instructions for working with the poST core: https://github.com/v-bashev/post_core/wiki 
- poST core: https://github.com/v-bashev/post_core
- poST to ST generation module: https://github.com/v-bashev/post_to_st 
- poST to ST web transtator: http://post2st.iae.nsk.su
## Build
```
yarn
```
  
## Launching web version
```
cd browser-app
yarn run start --hostname <hostname> --port <port>
```
## Dependencies
- java 11+
- node 10.x.x (e.g. 10.24.1)
- npm 6.x.x (e.g. 6.14.12)
- yarn 1.22.x (e.g. 1.22.17)
## Install Dependencies
```
sudo apt update
curl -sL https://deb.nodesource.com/setup_10.x | sudo bash -
sudo apt-get install -y nodejs
npm install --global yarn
```
