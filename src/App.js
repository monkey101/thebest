import React, { Component } from 'react';
import { BrowserRouter, Route, Link } from "react-router-dom";
import {
     Stitch,
     RemoteMongoClient,
    AnonymousCredential
} from "mongodb-stitch-browser-sdk";
import './App.css';

let dbName = "test";
let colName = "best";
const client = Stitch.initializeDefaultAppClient("best-fzcva");
client.auth.loginWithCredential(new AnonymousCredential())
const bestCol = client.getServiceClient(RemoteMongoClient.factory,
                                      "mongodb-atlas").db(dbName).collection(colName);
let props = {client, bestCol};


class Year extends Component {
constructor(props) {
   super(props);

   this.state = {
      playlists: []
   };
   this.client = props.client;
   this.bestCol = props.bestCol;
}
};


class YearsList extends Component {
constructor(props) {
   super(props);

   this.state = {
      years: []
   };
   this.client = props.client;
   this.bestCol = props.bestCol;
}

loadList() {
  const pipeline = [ {
      "$group": {
        "_id": null,
        "yearList": {
          "$addToSet": {
            "year": "$year"
          }
        }
      }
    },
    { "$unwind": { "path": "$yearList"} },
    { "$project": {"year": "$yearList.year"} }
  ];
  this.bestCol.aggregate(pipeline).asArray().then(docs => {
    this.setState({ years: docs });
  });
}

componentWillMount() {
   this.loadList();
}

componentDidMount() {
   this.loadList();
}

render() {
   let result = (
      <div>
        <table>
        {this.state.years.map(year => (
          <tr>
          <td className="items-list">
             <div><Link to={year.year}>{year.year}</Link></div>
          </td>
         </tr>
        ))}
        </table>
      </div>
   );
   return result;
}
};

class App extends Component {
  render() {
    return (
      <BrowserRouter>
      <div className="App">
        <header className="App-header">
          <b>The Best</b>
          <YearsList {...props}/>
        </header>
      </div>
      </BrowserRouter>
    );
  }
}

export default App;
