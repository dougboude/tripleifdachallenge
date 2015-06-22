tripleiFDAchallenge
===================

[![Build Status](https://travis-ci.org/FDA/openfda.svg?branch=master)](https://github.com/dougboude/tripleifdachallenge)

tripleiFDAchallenge is a proof-of-concept project to answer the OpenFDA Developer Challenge to use the FDA's publicly available data on drug adverse events, medical device adverse events, and medication error reports.

*Please note that openFDA is a beta research project and not for clinical use. While the FDA makes every effort to ensure that data and logic are accurate, you should assume all results are unvalidated.*

# Contents

This repository contains the connects to the `api.fda.gov/drug/event.json` end point:

* A primary web application page written in HTML.

* A few connection scripts WHICH REQUIRE A BETTER DESCRIPTION

# Prerequisites

Not necessarily the following:
* Elasticsearch 1.2.0 or later
* Python 2.7.*
* Node 0.10.*

# Packaging

Packaging info would be a good idea here.  The following sample line doesn't really apply.
Run `bootstrap.sh` to download and setup a virtualenv for the `openfda` python package and to download and setup the `openfda-api` node package.