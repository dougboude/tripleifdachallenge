tripleiFDAchallenge
===================

[![Build Status](https://travis-ci.org/FDA/openfda.svg?branch=master)](https://github.com/dougboude/tripleifdachallenge)

tripleiFDAchallenge is a proof-of-concept project to answer the OpenFDA Developer Challenge to use the FDA's publicly available data on drug adverse events, medical device adverse events, and medication error reports.  

Powered by jQuery, jQueryUI, charts.js, and Bootstrap 3, this single page HTML5 web application utilizes the OpenFDA dataset as its model, and is designed as a tool to assist researchers in identifying anomalies (*spikes*) in aggregated datasets meeting the researchers' specified criteria.  Furthermore, this tool enables researchers to delve into the details that comprise the identified anomalies.

*Please note that openFDA is a beta research project and not for clinical use. While the FDA makes every effort to ensure that data and logic are accurate, you should assume all results are unvalidated.*

# Contents

This repository contains code for a single page web application written in HTML5 which connects to the `api.fda.gov/drug/event.json` end point.  

It includes:

* A primary web application page written in HTML5.

* javascript files

* Stylesheets and fonts

# Prerequisites

This web application requires no backend server support, but does require an open internet connection and a modern browser, such as 
   * Internet Explorer 11.0 or later
   * Firefox 38.0 or later 
or 
   * Chrome 43.0 or later

# Packaging

A functional prototype of this web app, named Triple-i Researcher, is posted at http://iiiresearch.net/.

This web app may also be distributed via a simple zip file, to be installed and run locally.
To install, unzip the file on your local PC, then open index.html with a modern browser.