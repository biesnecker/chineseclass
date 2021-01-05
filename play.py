#!/usr/bin/env python3

import json
import os
import sys

from pathlib import Path


def main(args):
    if len(args) < 2:
        print("Usage: play.py CHARACTER")
        exit(1)

    publicDir = Path.cwd() / "public"
    dataFile = publicDir / "data.json"
    audioDir = publicDir / "audio"

    char = args[1]
    with open(dataFile) as f:
        data = json.load(f)
    for obj in data:
        if obj["character"] == char:
            path = audioDir / obj["audio"]
            os.system(f"afplay {path}")


if __name__ == "__main__":
    main(sys.argv)