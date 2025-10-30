; NSIS installer for Print Proxy (Auto-start version)
; No Windows Service - Uses Registry Auto-start instead

!define APP_NAME "Print Proxy"
!define COMPANY_NAME "PrintProxy"
!define VERSION "1.0.0"
!define INSTALL_DIR "$PROGRAMFILES\${COMPANY_NAME}"

; Use absolute paths passed from PowerShell script
; If not defined, fall back to relative paths
!ifndef DIST_PATH
  !define DIST_PATH "..\..\dist"
!endif

!ifndef TEMPLATES_PATH
  !define TEMPLATES_PATH "..\..\app\templates"
!endif

!define DIST_EXE "${DIST_PATH}\PrintProxy.exe"
!define TEMPLATES_DIR "${TEMPLATES_PATH}"
; Use absolute path for output file in dist directory
!ifndef OUT_PATH
  !define OUT_PATH "..\..\dist"
!endif

!define OUT_FILE "${OUT_PATH}\PrintProxySetup_${VERSION}.exe"

SetCompress auto
SetCompressor lzma

RequestExecutionLevel admin
Name "${APP_NAME}"
OutFile "${OUT_FILE}"
InstallDir "${INSTALL_DIR}"

!include "MUI2.nsh"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"

Section "Install"
  SetOutPath "$INSTDIR"
  
  ; Copy main executable
  File "${DIST_EXE}"
  
  ; Create logs directory
  CreateDirectory "$INSTDIR\logs"
  
  ; Create app/templates directory and copy template files
  CreateDirectory "$INSTDIR\app"
  CreateDirectory "$INSTDIR\app\templates"
  SetOutPath "$INSTDIR\app\templates"
  File "${TEMPLATES_DIR}\dashboard.html"
  File "${TEMPLATES_DIR}\login.html"
  SetOutPath "$INSTDIR"
  
  ; Create shortcuts
  CreateDirectory "$SMPROGRAMS\${COMPANY_NAME}"
  CreateShortCut "$SMPROGRAMS\${COMPANY_NAME}\${APP_NAME}.lnk" "$INSTDIR\PrintProxy.exe"
  CreateShortCut "$SMPROGRAMS\${COMPANY_NAME}\Stop ${APP_NAME}.lnk" "taskkill" "/F /IM PrintProxy.exe"
  CreateShortCut "$DESKTOP\${APP_NAME}.lnk" "$INSTDIR\PrintProxy.exe"
  
  ; Add to startup (current user - runs with user permissions)
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${APP_NAME}" '"$INSTDIR\PrintProxy.exe"'
  
  ; Create uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  
  ; Add to Programs and Features
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayName" "${APP_NAME}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "Publisher" "${COMPANY_NAME}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayIcon" "$INSTDIR\PrintProxy.exe"
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "NoRepair" 1
  
  ; Start the application immediately
  MessageBox MB_YESNO "${APP_NAME} has been installed.$\n$\nStart ${APP_NAME} now?" IDNO skipstart
  Exec '"$INSTDIR\PrintProxy.exe"'
  skipstart:
SectionEnd

Section "Uninstall"
  ; Stop running process
  ExecWait 'taskkill /F /IM PrintProxy.exe'
  
  ; Remove from startup
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${APP_NAME}"
  
  ; Remove shortcuts
  Delete "$SMPROGRAMS\${COMPANY_NAME}\${APP_NAME}.lnk"
  Delete "$SMPROGRAMS\${COMPANY_NAME}\Stop ${APP_NAME}.lnk"
  Delete "$DESKTOP\${APP_NAME}.lnk"
  RMDir "$SMPROGRAMS\${COMPANY_NAME}"
  
  ; Remove files
  Delete "$INSTDIR\PrintProxy.exe"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir /r "$INSTDIR\logs"
  RMDir /r "$INSTDIR\app"
  RMDir "$INSTDIR"
  
  ; Remove from Programs and Features
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}"
SectionEnd
