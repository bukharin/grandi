{
    "variables": {
      "ndi_dir": "<(module_root_dir)/ndi"
    },
    "targets": [ {
        "target_name": "grandi",
        "sources": [
            "lib/grandi_util.cc",
            "lib/grandi_find.cc",
            "lib/grandi_send.cc",
            "lib/grandi_receive.cc",
            "lib/grandi_routing.cc",
            "lib/grandi.cc"
        ],
        "include_dirs": [ "ndi/include" ],
        "conditions":[
            [ "OS == 'win' and target_arch == 'ia32'", {
                "copies": [ {
                    "destination":  "build/Release",
                    "files":        [ "<(ndi_dir)/lib/win-x86/Processing.NDI.Lib.x86.dll" ]
                } ],
                "link_settings": {
                    "libraries":    [ "Processing.NDI.Lib.x86.lib" ],
                    "library_dirs": [ "<(ndi_dir)/lib/win-x86" ]
                }
            } ],
            [ "OS == 'win' and target_arch == 'x64'", {
                "copies": [ {
                    "destination":  "build/Release",
                    "files":        [ "<(ndi_dir)/lib/win-x64/Processing.NDI.Lib.x64.dll" ]
                } ],
                "link_settings": {
                    "libraries":    [ "Processing.NDI.Lib.x64.lib" ],
                    "library_dirs": [ "<(ndi_dir)/lib/win-x64" ]
                }
            } ],
            [ "OS == 'linux' and target_arch == 'ia32'", {
                "copies": [ {
                    "destination":  "build/Release",
                    "files":        [ "<(ndi_dir)/lib/lnx-x86/libndi.so",
                                      "<(ndi_dir)/lib/lnx-x86/libndi.so.6",
                                      "<(ndi_dir)/lib/libndi_licenses.txt" ]
                } ],
                "link_settings": {
                    "libraries":    [ "-Wl,-rpath,'$$ORIGIN'", "-lndi" ],
                    "library_dirs": [ "<(ndi_dir)/lib/lnx-x86" ]
                }
            } ],
            [ "OS == 'linux' and target_arch == 'x64'", {
                "copies": [ {
                    "destination":  "build/Release",
                    "files":        [ "<(ndi_dir)/lib/lnx-x64/libndi.so",
                                      "<(ndi_dir)/lib/lnx-x64/libndi.so.6",
                                      "<(ndi_dir)/lib/libndi_licenses.txt" ]
                } ],
                "link_settings": {
                    "libraries":    [ "-Wl,-rpath,'$$ORIGIN'", "-lndi" ],
                    "library_dirs": [ "<(ndi_dir)/lib/lnx-x64" ]
                }
            } ],
            [ "OS == 'linux' and target_arch == 'arm'", {
                "copies": [ {
                    "destination":  "build/Release",
                    "files":        [ "<(ndi_dir)/lib/lnx-armv7l/libndi.so",
                                      "<(ndi_dir)/lib/lnx-armv7l/libndi.so.6" ]
                } ],
                "link_settings": {
                    "libraries":    [ "-Wl,-rpath,'$$ORIGIN'", "-lndi" ],
                    "library_dirs": [ "<(ndi_dir)/lib/lnx-armv7l" ]
                }
            } ],
            [ "OS == 'linux' and target_arch == 'arm64'", {
                "copies": [ {
                    "destination":  "build/Release",
                    "files":        [ "<(ndi_dir)/lib/lnx-arm64/libndi.so",
                                      "<(ndi_dir)/lib/lnx-arm64/libndi.so.6",
                                      "<(ndi_dir)/lib/libndi_licenses.txt" ]
                } ],
                "link_settings": {
                    "libraries":    [ "-Wl,-rpath,'$$ORIGIN'", "-lndi" ],
                    "library_dirs": [ "<(ndi_dir)/lib/lnx-arm64" ]
                }
            } ],
            [ "OS == 'mac'", {
                "copies": [ {
                    "destination":  "build/Release",
                    "files":        [ "<(ndi_dir)/lib/mac_universal/libndi.dylib",
                                      "<(ndi_dir)/lib/libndi_licenses.txt" ]
                } ],
                "link_settings": {
                    "libraries":    [ "-Wl,-rpath,@loader_path", "-lndi" ],
                    "library_dirs": [ "<(ndi_dir)/lib/mac_universal" ]
                }
            } ]
        ]
    } ]
}
