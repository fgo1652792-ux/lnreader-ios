Pod::Spec.new do |s|
  s.name           = 'NativeCrashLogs'
  s.version        = '1.0.0'
  s.summary        = 'NativeCrashLogs module (iOS: restart + JS crash breadcrumb)'
  s.description    = 'NativeCrashLogs module'
  s.license        = 'MIT'
  s.author         = ''
  s.homepage       = 'https://github.com/LNReader/lnreader'
  s.platforms      = { :ios => '15.5', :tvos => '15.5' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'React-Core'

  s.source_files = "**/*.{h,m,swift}"
end
