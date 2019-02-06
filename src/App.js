import React, { Component } from 'react';
import {
     Stitch,
     RemoteMongoClient,
    AnonymousCredential
} from "mongodb-stitch-browser-sdk";
import logo from './logo.svg';
import './App.css';

let dbName = "test";
let colName = "best";
const client = Stitch.initializeDefaultAppClient("best-fzcva");
client.auth.loginWithCredential(new AnonymousCredential())
const best = client.getServiceClient(RemoteMongoClient.factory,
                                      "mongodb-atlas").db(dbName).collection(colName);
let props = {client, best};


class YearsList extends Component {
constructor(props) {
   super(props);

   this.state = {
      years: []
   };
   this.client = props.client;
   this.best = props.best;
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
  this.best.aggregate(pipeline).asArray().then(docs => {
    this.setState({ years: docs, requestPending: false });
  });
}

componentWillMount() {
   this.loadList();
}

/*
checkHandler(id, status) {
   this.items.updateOne({ _id: id }, { $set: { checked: status } }).then(() => {
      this.loadList();
   }, { rule: "checked" });
}
*/

componentDidMount() {
   this.loadList();
}

render() {
   let result = (
      <div>
        {this.state.years.map(year => (
          <ul className="items-list">
            {year.year}
          </ul>
        ))}
      </div>
   );
   return result;
}
};

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            <p>
            {Stitch.defaultAppClient.auth.isLoggedIn ?
                              "logged in" :
                              "not logged in"
            }
            </p>
          </p>
          <YearsList {...props}/>

          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    );
  }
}

export default App;
