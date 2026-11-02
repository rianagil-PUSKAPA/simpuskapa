#!/bin/bash
sonar-scanner \
  -Dsonar.projectKey=simpuskapa \
  -Dsonar.sources=. \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=sqp_0f2e0364590e5afac8802fb9fcbf371e5c4631c7
