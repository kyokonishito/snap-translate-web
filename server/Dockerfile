FROM node:8
RUN apt-get update

RUN apt-get remove -y mysql-common  && rm -rf /etc/mysql
RUN apt update && apt -y upgrade openssl
RUN apt update && apt -y upgrade perl

RUN apt-get -q -y install libleptonica-dev
RUN apt-get -q -y install libtesseract3 libtesseract-dev
RUN apt-get update && apt-get -q -y install tesseract-ocr
RUN apt-get update && apt-get -q -y install tesseract-ocr-hin tesseract-ocr-ara tesseract-ocr-fra tesseract-ocr-fin tesseract-ocr-jpn tesseract-ocr-pol tesseract-ocr-spa tesseract-ocr-rus tesseract-ocr-ita tesseract-ocr-por tesseract-ocr-kor tesseract-ocr-ces tesseract-ocr-dan tesseract-ocr-deu tesseract-ocr-nld tesseract-ocr-swe tesseract-ocr-tur

RUN apt-get -q -y install git
RUN apt-get -q -y install gcc

COPY app.js .
COPY tools.js .
COPY package.json .
COPY .env .
RUN mkdir /public
COPY public/index.html /public
COPY public/ibmDeveloper.jpg /public
RUN npm install
EXPOSE 3000
CMD node app.js