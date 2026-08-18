#!/bin/sh
case "$1" in
  *Username*) printf '%s\n' 'x-access-token' ;;
  *Password*) printf '%s' "$GITHUB_TOKEN" ;;
  *) printf '%s' '' ;;
esac
