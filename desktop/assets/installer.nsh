!macro customInstall
  ; Only NSIS writes this marker. The separate MSI package keeps manual updates.
  FileOpen $0 "$INSTDIR\resources\installer-type" w
  FileWrite $0 "nsis"
  FileClose $0
!macroend
