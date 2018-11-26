# NJS_MC_HW6
Homework Assignment #6 in the Node JS Master Class

## About
This is the same API version as the one in Homework Assignment #1, except this uses the cluster module to spawn multiple workers, one for each cpu core on the machine.

It listens to port 1337 by default and only responds with 200 if it receives a POST request that has a non-empty payload.