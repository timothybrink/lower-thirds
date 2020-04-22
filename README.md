# Network Slides

This is a simple web application for presenting text over a network, with one device as a presenter and others as viewers. Originally designed for use in OBS Studio as a simple way of presenting simple text lower thirds.

## Usage

To start the server, run

```console
$ node server.js -a <ip address> -p <port>
```

The ip address and port default to localhost:5500.

The presenter view is found at http://localhost:5500/presenter, and
to view, go to http://localhost:5500.