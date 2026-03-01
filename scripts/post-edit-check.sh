#!/bin/bash
# Post-edit hook: Run lint, unused-code check, and type checks after file edits

set -e

pnpm biome:check
pnpm knip
pnpm tsc
