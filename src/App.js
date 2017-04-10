import React, { Component } from 'react';
import littlebits from '@littlebits/cloud-http'
import CodeMirror from 'react-codemirror'
import md5 from 'blueimp-md5'
import rp from 'request-promise'
import defaultData from './data.json'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/javascript/javascript'
import 'codemirror/addon/lint/lint.css'
import './jsonlint'
import 'codemirror/addon/lint/lint'
import 'codemirror/addon/lint/json-lint'
import './app.css'

const subscribtion_url = 'http://207.154.248.171/message'
const devicelist_url = 'http://207.154.248.171/devicelist'
const info_log_url = 'http://207.154.248.171'
const md5Pass = '98c04d88b2886a3ec57a0fb92619d444'

class App extends Component {
  constructor (props) {
    super(props)
    this.state = {
      logDevices: [],
      log: [],
      code: JSON.stringify(defaultData, null, 2)
    }
  }

  updateCode(newCode) {
    this.setState({
      code: newCode
    })
  }

  refreshDevices() {
    const pass = md5(this.refs.pass.value)
    if (pass !== md5Pass) {
      alert('Pogresan password!')
      return
    }
    const logDevices = []

    const info = (message) => {
      logDevices.push({ type: 'info', message })
      this.setState({ logDevices })
    }

    const error = (message) => {
      logDevices.push({ type: 'error', message })
      this.setState({ logDevices })
    }

    const succ = (message) => {
      logDevices.push({ type: 'succ', message })
      this.setState({ logDevices })
    }

    let parsed
    try {
      parsed = JSON.parse(this.state.code)
    } catch(e) {
      error('Error parsing data. Check your json')
    }

    if (!Array.isArray(parsed.display_on_map)) {
      error('error parsing data. display_on_map must be an array')
      return
    }

    succ('parsed succesfully')
    info(`sending device list to ${info_log_url}`)
    
    rp({
        method: 'POST',
        uri: devicelist_url,
        body: { 
          device_list: parsed.display_on_map,
          password: this.refs.pass.value
        },
        json: true
    })
    .then(function (parsedBody) {
      succ('device list sent succesfully')
    })
    .catch(function (err) {
      error('error sending device list')
    })
  }

  parseData() {
    const pass = md5(this.refs.pass.value)
    if (pass !== md5Pass) {
      alert('Pogresan password!')
      return
    }

    if (!confirm('Subscribtioni koji vec postoje na deviceu, nece se pobrisati! Nastavi sa kreiranjem subscribtiona na svaki device?')) {
      return
    }
    const log = []

    const info = (message) => {
      log.push({ type: 'info', message })
      this.setState({ log })
    }

    const error = (message) => {
      log.push({ type: 'error', message })
      this.setState({ log })
    }

    const succ = (message) => {
      log.push({ type: 'succ', message })
      this.setState({ log })
    }

    let parsed
    try {
      parsed = JSON.parse(this.state.code)
    } catch(e) {
      error('Error parsing data. Check your json')
    }

    succ('parsed succesfully')
    info('starting device subscription')

    let num = 0
    const next = () => {
      let currentDevice = parsed.create_subscriptions[num]
      if (!currentDevice) {
        return
      }
      let subscribeFn = littlebits
        .defaults({ access_token: currentDevice.access_token })
        .subscribe.defaults({
            publisher_id: currentDevice.device_id,
            subscriber_id: subscribtion_url,
            publisher_events: currentDevice.publisher_events
        })
      
      subscribeFn((err, res) => {
        if (err) {
          error(`error subscribing ${currentDevice.device_id} to ${subscribtion_url}: ${err.message}`)
          return
        }
        succ(`succesfully subscribed ${currentDevice.device_id} to ${subscribtion_url}`)
        num++
        setTimeout(next, 1000)
      })
    }

    // initialize
    next()
  }

  render() {
    var options = {
			lineNumbers: true,
      tabSize: 2,
      mode: "application/json",
      gutters: ["CodeMirror-lint-markers"],
      lint: true
		}

    return (
      <div>
        <div className="left">
          <CodeMirror 
            value={this.state.code} onChange={this.updateCode.bind(this)}
            options={options} />
        </div>
        <div className="right">
          <p>
            Password: <input ref="pass" type='password' />
          </p>
          <p>
            Osvjezi mapu uredjaja sa listom "display_on_map": 
            <br />
            <button onClick={this.refreshDevices.bind(this)} >REFRESH DEVICE LIST</button>
          </p>
          <ul className='log'>
          {this.state.logDevices.map((item, i) => (
            <li className={item.type} key={i}>{item.message}</li>
          ))}
          </ul>
          <p>
            Napravi subscription za sve uredjaje iz liste "create_subscriptions": 
            <br />
            <button onClick={this.parseData.bind(this)} >CREATE SUBSCRIBTIONS</button>
          </p>
          <ul className='log'>
          {this.state.log.map((item, i) => (
            <li className={item.type} key={i}>{item.message}</li>
          ))}
          </ul>
        </div>
      </div>
    );
  }
}

export default App;
