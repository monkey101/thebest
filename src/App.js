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
let props = {client: client, bestCol: bestCol};


class Year extends Component {
constructor(props) {
	super(props);

	this.state = {
		playlists: []
	};
	this.bestCol = props.bestCol;
	this.year = null;
}

componentDidMount() {
   this.loadPlaylist();
}

loadPlaylist() {
  this.year = this.props.match.params.year;
  const pipeline = [
    { "$match": { "year": this.year } },
    { "$group": { "_id": "$playlist" } },
    { "$sort": {"_id": 1} }
  ];
  this.bestCol.aggregate(pipeline).asArray().then(docs => {
    this.setState({ playlists: docs });
  });
}

render() {
	console.log("rendered playlists")
   let result = (
      <div>
				<h3>Year: {this.year}</h3>
				<ul style={{ listStyleType: "none", padding: 0 }}>
        {this.state.playlists.map(playlist=> (
          <li>
             <div><Link to={`/year/${playlist._id}`}>{playlist._id}</Link></div>
          </li>
        ))}
        </ul>
      </div>
   );
   return result;
}
};


class YearsList extends Component {
constructor(props) {
  super(props);

  this.state = {
    years: []
  };
  this.bestCol = props.bestCol;
}

loadList() {
  const pipeline = [ 
    { "$group": { "_id": "$year" } },
    { "$sort": { "_id": 1 } }
  ];
  this.bestCol.aggregate(pipeline).asArray().then(docs => {
    this.setState({ years: docs });
  });
}

componentDidMount() {
   this.loadList();
}

render() {
	console.log("rendered years");
   let result = (
      <div>
				<ul style={{ listStyleType: "none", padding: 0 }}>
        {this.state.years.map(year => (
          <li>
             <div><Link to={`/year/${year._id}`}>{year._id}</Link></div>
          </li>
        ))}
        </ul>
      </div>
   );
   return result;
}
};

class App extends Component {
  render() {
    return (
      <BrowserRouter>
				<div style={{ display: "flex" }}>
					<div
						style={{
							padding: "10px",
							width: "20%",
							background: "#f0f0f0"
						}}
					>
            <span className="logo">
              <Link to="/" className="home-link">
                The Best
              </Link>
            </span>
						<YearsList {...props}/>
					</div>
					<div style={{ flex: 1, padding: "10px" }}>
						<Route exact
							path="/year/:year"
							render={(props) => <Year {...props} bestCol={bestCol}/>}
						/>
						<div>
						</div>
          </div>
       </div>
      </BrowserRouter>
  );
}
};

export default App;
