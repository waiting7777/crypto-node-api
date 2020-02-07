const axios = require('axios')
const queryString = require('query-string')
const dayjs = require('dayjs')
const crypto = require('crypto')

const RECVWINDOW = 10000


class Binance {
  constructor({ apiKey, secretKey }) {
    this.apiUrl = 'https://api.binance.com/'
    this.apiKey = apiKey
    this.secretKey = secretKey
  }

  getSign(cmd) {
    return crypto.createHmac('sha256', this.secretKey).update(queryString.stringify(cmd)).digest('hex')
  }
  
  doGet(url, cmd = {}) {
    return new Promise(resolve => {
      axios({
        method: 'get',
        url: `${this.apiUrl}${url}?${queryString.stringify(cmd)}`,
        headers: {
          'X-MBX-APIKEY': `${this.apiKey}`
        }
      })
      .then(res => resolve(res.data))
      .catch(error => resolve(error.response.data))  
    })
  }

  doGetWithSign(url, cmd) {
    cmd.signature = this.getSign(cmd)
    return this.doGet(url, cmd)
  }

  getSystemStatus() {
    return this.doGet('wapi/v3/systemStatus.html')
  }

  getServerTime() {
    return this.doGet('api/v1/time')
  }

  getAccountInfo() {
    const cmd = {
      timestamp: dayjs().valueOf(),
      recvWindow: RECVWINDOW
    }
    return this.doGetWithSign('api/v3/account', cmd)
  }
}

module.exports = Binance