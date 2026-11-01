const fs = require('node:fs/promises')

// electron-builder registers protocols for NSIS/macOS, but its MSI template
// needs a WiX registry component. HKCU keeps installation scoped to this user.
module.exports = async function registerMsiProtocol(projectFile) {
  const xml = await fs.readFile(projectFile, 'utf8')
  if (xml.includes('SimPuskapaProtocol')) return
  const anchor = '<ComponentGroup Id="ProductComponents" Directory="APPLICATIONFOLDER">'
  if (xml.split(anchor).length !== 2) throw new Error('Cannot register the SIM PUSKAPA MSI protocol')
  const component = `
      <Component Id="SimPuskapaProtocol" Guid="*">
        <RegistryKey Root="HKCU" Key="Software\\Classes\\simpuskapa">
          <RegistryValue Type="string" Value="URL:SIM PUSKAPA" KeyPath="yes"/>
          <RegistryValue Name="URL Protocol" Type="string" Value=""/>
          <RegistryKey Key="DefaultIcon"><RegistryValue Type="string" Value="&quot;[#mainExecutable]&quot;,0"/></RegistryKey>
          <RegistryKey Key="shell\\open\\command"><RegistryValue Type="string" Value="&quot;[#mainExecutable]&quot; &quot;%1&quot;"/></RegistryKey>
        </RegistryKey>
      </Component>`
  await fs.writeFile(projectFile, xml.replace(anchor, anchor + component))
}
