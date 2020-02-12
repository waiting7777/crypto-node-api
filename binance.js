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

  injectTimeAndRecvWindow(cmd) {
    return {
      ...cmd,
      timestamp: dayjs().valueOf(),
      recvWindow: RECVWINDOW
    }
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

  doPostWithSign(url, cmd) {
    return new Promise(resolve => {
      axios({
        method: 'post',
        url: `${this.apiUrl}${url}?${queryString.stringify(cmd)}&signature=${this.getSign(cmd)}`,
        headers: {
          'X-MBX-APIKEY': `${this.apiKey}`
        }
      })
      .then(res => resolve(res.data))
      .catch(error => resolve(error.response.data))
    })
  }

  doDeleteWithSign(url, cmd) {
    return new Promise(resolve => {
      axios({
        method: 'delete',
        url: `${this.apiUrl}${url}?${queryString.stringify(cmd)}&signature=${this.getSign(cmd)}`,
        headers: {
          'X-MBX-APIKEY': `${this.apiKey}`
        }
      })
      .then(res => resolve(res.data))
      .catch(error => resolve(error.response.data))
    })
  }

  getSystemStatus() {
    return this.doGet('wapi/v3/systemStatus.html')
  }

  getCoinsInfo() {
    const cmd = {}
    return this.doGetWithSign('sapi/v1/capital/config/getall', this.injectTimeAndRecvWindow(cmd))
  }

  getAccountSnapshot(type, startTime, endTime, limit) {
    const cmd = {
      type: 'SPOT'
    }
    return this.doGetWithSign('sapi/v1/accountSnapshot', this.injectTimeAndRecvWindow(cmd))
  }

  getDepositHistory(asset = 'LINK', status = 1, startTime = '', endTime = '') {
    const cmd = {
      asset,
      status,
      // startTime,
      // endTime
    }
    return this.doGetWithSign('wapi/v3/depositHistory.html', this.injectTimeAndRecvWindow(cmd))
  }

  getServerTime() {
    return this.doGet('api/v1/time')
  }

  getAccountInfo() {
    const cmd = {}
    return this.doGetWithSign('api/v3/account', this.injectTimeAndRecvWindow(cmd))
  }

  doOrder(symbol, type, side, quantity, price, timeInForce = 'GTC') {
    const cmd = {
      symbol,
      side,
      timeInForce,
      type,
      quantity,
      price
    }
    return this.doPostWithSign('api/v3/order', this.injectTimeAndRecvWindow(cmd))
  }

  getOpenOrder(symbol) {
    const cmd = {
      symbol
    }
    return this.doGetWithSign('api/v3/openOrders', this.injectTimeAndRecvWindow(cmd))
  }

  doCancelOrder(symbol, orderId) {
    const cmd = {
      symbol,
      orderId
    }
    return this.doDeleteWithSign('api/v3/order', this.injectTimeAndRecvWindow(cmd))
  }
}

module.exports = Binance