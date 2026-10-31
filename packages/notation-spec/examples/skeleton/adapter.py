#!/usr/bin/env python3
"""A starting point for an RDN conformance adapter, in Python.

    npx @randsum/notation-spec -- python3 adapter.py

The runner writes one JSON request per line; answer each with one JSON line.
Replace evaluate() with a call into your own roller: replay the request's die
values in place of its random number generator, in the order they are consumed
(seedRolls, rerollRolls, explodeRolls, compoundRolls, penetrateRolls, then
sequenceRolls), and return the final pool and total, or an error.
"""
import json
import sys


def evaluate(request):
    # return {"pool": [3, 5, 2], "total": 10}
    # return {"pool": [...], "total": ..., "seeded": False}  # rolled at random
    return {"error": "not implemented: " + request["notation"]}


for line in sys.stdin:
    if line.strip():
        request = json.loads(line)
        response = evaluate(request)
        response["id"] = request["id"]
        print(json.dumps(response), flush=True)
