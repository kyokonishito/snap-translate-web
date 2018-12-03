module.exports = {
    setResult: function (result, data, ocropt, sentiment, emotion, errMsg ) {
        result.json({
            data: data,
            ocropt: ocropt,
            sentiment: sentiment,
            emotion: emotion,
            errMsg: errMsg
        })
    },
    setError: function (result, errMsg) {
      this.setResult(result, '', '', '',  { sadness: '', joy: '', fear: '', disgust: '', anger: '' },
      errMsg)
    }
  };