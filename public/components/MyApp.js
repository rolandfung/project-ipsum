import React from 'react';
import actions from '../actions/ipsumActions.js';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { renderChart } from '../D3graphTemplate';
import { Panel, Grid, Row, Col, PageHeader, Button, Image} from 'react-bootstrap';
import request from '../util/restHelpers';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import barGraph from './BarGraph';
import _ from 'underscore';
import MyAppHistory from './MyAppHistory';
import Select from 'react-select';

class MyApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lineGraphRoute: null,
      resizefunc: null,
      loading1: false,
      loading2: false
    };
  }

  getAndGraphTodaysData(){
    this.setState({loading1: true}, () => {
      // call 24 hr bar graph data and render
      request.post('/getStats/serverTotalsForApp', {
        appid: this.props.state.appSelection.id,
        hours: 24
      }, (err, data) => {
        if (err) {console.log('ERROR', err); return; }
        var data = JSON.parse(data.text);
        var output = [];
        Object.keys(data).forEach((serverId) => {
          output.push({
            value: data[serverId].statValue,
            label: data[serverId].hostname,
            id: Number(serverId)
          });
        });

        // for relative server load bar graph
        this.props.dispatch(actions.CHANGE_APP_SERVER_TOTALS(output));
        this.setState({loading1: false}, () => {
          barGraph('todayBarGraph', _.sortBy(this.props.state.appServerTotals, (obj) => {
            return -obj.value;
          }));
        }); 
      });
      
    });

    //For routes line Graph
    this.props.dispatch(actions.ADD_LINE_GRAPH_TITLE('/Total'));
    var appId = this.props.state.appSelection.id;
    this.setState({loading2: true}, () => {

      request.post('/getStats/app',
        {appId: appId, hours: 24}, //TODO figure out how to keep track of desired hours, have user settings/config in store?
        (err, res) => {
          this.setState({loading2: false})
          if (err) { console.log("Error getting Server Data", err); }
          this.props.dispatch(actions.ADD_SERVER_DATA(res.body));
          this.setState({lineGraphRoute: this.props.state.graphData[0].route});
          renderChart('lineGraph', this.props.state.graphData[0].data);
      });

      this.setState({resizefunc: this.resizedb()}, () => {
        window.addEventListener('resize', this.state.resizefunc);
      })
      
    })
  }

  componentDidMount() {
    this.getAndGraphTodaysData();
  }

  resizedb() {
    var redraw = function() {
      // linegraph 
      this.updateGraph({value: this.state.lineGraphRoute});
      // horizontal bar graph
      barGraph('todayBarGraph', _.sortBy(this.props.state.appServerTotals, (obj) => {
        return -obj.value;
      }));
    }
    return _.debounce(redraw.bind(this), 500)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.state.resizefunc);
  }

  updateGraph(value) {
    !value ? null : 
    this.setState({lineGraphRoute: value.value});
    this.props.dispatch(actions.ADD_LINE_GRAPH_TITLE("/" + value.value));
    d3.select('#lineGraph > svg').remove(); 
    renderChart('lineGraph', _.findWhere(this.props.state.graphData, {route: value.value}).data);
  }

  tableLinkForm(cell) {
    return (
      <Link to="/myServer">
        <div onClick={this.goToServer.bind(this, cell)}>
          {_.findWhere(this.props.state.servers, {id: cell}).active}
        </div>
      </Link>
      );
  }

  goToServer(cell) {
    this.props.dispatch(actions.ADD_SERVER_SELECTION(_.findWhere(this.props.state.servers, {id: cell})));
  }

  enumFormatter(cell, row, enumObject) {
    return enumObject(cell);
  }

  render() {
    var sortedServerTotals = _.sortBy(this.props.state.appServerTotals, (obj) => {
        return -obj.value;
      });
    var statusData = sortedServerTotals.map((total, idx) => {
      return {
        label: total.label,
        status: _.findWhere(this.props.state.servers, {id: total.id}).active,
        id: total.id
      }
    })
    var lineGraphOptions = this.props.state.graphData.map((graph) => {return {label: '/'+graph.route, value: graph.route}})

    return (
       <Grid>
        <Row><Col xs={12} md={12}>
          <PageHeader>
            {this.props.state.appSelection.appname} <small>at a glance</small>
          </PageHeader>
        </Col></Row>

        <Row className='serverStatContainer'>

          <Col xs={12} lg={12} >
          <div style={{display:'flex', justifyContent:'space-between'}}>
            <h2>What{'\''}s Happening</h2>  <span className='pull-right'>
              <Button onClick={this.getAndGraphTodaysData.bind(this)} bsStyle='primary'>Refresh</Button>
            </span>
          </div>

            <Panel header={<div>Routes</div>} >
            <Grid fluid>
            <Row>
            <Col xs={12} lg={12}>

            {this.state.loading2 ? <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}><img src="assets/loading.gif" /></div> : 
              <div>
                <Select
                  value={this.state.lineGraphRoute}
                  multi={false}
                  options={lineGraphOptions}
                  onChange={this.updateGraph.bind(this)}
                  />
                <h3 className="linegraph-title">Hits Per Hour Today</h3>
                <p className="xAxis-subtitle">for {this.props.state.lineGraphTitle == '/Total' ? 'all monitored routes' : <i>{this.props.state.lineGraphTitle}</i>}</p>

                <div id="lineGraph"></div>
                <h5 className="xAxis-title">Hours Ago</h5>
              </div>
            }
            </Col>
            </Row>
            </Grid>
            </Panel>
          </Col>

        </Row>
        <Row>
          <Col xs={12} md={12}>
            <Panel header={<h1>Server Information</h1>}>
              <Grid fluid>
              <Row>
                <Col xs={12} md={6}>
                <h4>Relative load (24 hr)</h4>
                {this.state.loading1 ? <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}><img src="assets/loading.gif" /></div> : 
                <div id="todayBarGraph"></div>
                }
                </Col>

                <Col xs={12} md={6}>
                <h4>Status</h4>
                <BootstrapTable ref='table' data={statusData} striped={true} hover={true} >
                  <TableHeaderColumn isKey={true} dataField="label" dataAlign="center">Hostname</TableHeaderColumn>
                  <TableHeaderColumn dataAlign="center" dataField="id" dataFormat={this.enumFormatter} formatExtraData={this.tableLinkForm.bind(this)}>See Stats</TableHeaderColumn>
                </BootstrapTable>

              </Col>
              </Row>
              </Grid>
            </Panel>
          </Col>
        </Row>
        <MyAppHistory />
      </Grid>
    )
  }
}

MyApp = connect(state => ({ state: state }))(MyApp);
export default MyApp
