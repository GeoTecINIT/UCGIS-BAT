## EO4GEO - BoK Annotation Tool (BAT)

The [BoK Annotation Tool (BAT)](https://eo4geo-bat.web.app) allows to easily annotate (associate) any PDF document with EO4GEO BoK concepts, to be used later in the BoK Matching Tool (BMT) to discover best matches. BAT automatically edits the pdf file’s metadata, adding the requested annotations using the Resource Description Framework (RDF).

#### Authors
The EO4GEO BoK tools are developed by the [Geospatial Technologies Research Group](http://geotec.uji.es/) (GEOTEC) from the University Jaume I, Castellón (Spain) and are Licensed under GNU GPLv3.


#### Prerequisites
Before you begin, make sure your development environment includes `Node.js®` and an `npm` package manager.

###### Node.js
Angular requires `Node.js` version 8.x or 10.x.

- To check your version, run `node -v` in a terminal/console window.
- To get `Node.js`, go to [nodejs.org](https://nodejs.org/).

###### Angular CLI
Install the Angular CLI globally using a terminal/console window.
```bash
npm install -g @angular/cli
```

## Installation

### Clone repo

``` bash
# clone the repo
$ git clone https://github.com/GeoTecINIT/EO4GEO-ABT.git my-project

# go into app's directory
$ cd my-project

# install app's dependencies
$ npm install
```

## Usage

``` bash
# serve with hot reload at localhost:4200.
$ ng serve

# build for production with minification
$ ng build
```
