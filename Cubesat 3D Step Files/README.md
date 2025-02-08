# bac-structure

Structural designs for the Build a CubeSat project. Includes CAD files and associated data like info on manufacturing, fastener selection, adhesive recommendations and the like.

## State of Development
This project is very much in its early days. None of the hardware here is flight-ready, tested or certified in any way. It is in active development and I share my progress on the [YouTube channel](https://youtube.com/@buildacubesat) and upload the CAD files here.

## Structure Goals
- [CDS 14.1](https://www.cubesat.org/s/CDS-REV14_1-2022-02-09.pdf) compliant
- Modular kit
- 1U, 1.5U, 2U and 3U sizes (_currently only working on 1U and 2U, remaining sizes will follow with a potential 6U expansion in 2026_)
- Easy, painfree assembly and disassembly
- Minimize amount of tapped holes
- Minimize use of threadlocker
- No thread inserts (Helicoils, etc.)
- No dead weight
- Budget friendly
- Made of Aluminum 6061 with 304 / A2 stainless steel fasteners

## Fusion 360 File
As the Fusion 360 binary files are a bit large to host in a repo, please find them in this [Google Drive folder](https://drive.google.com/drive/folders/121H3C5MyR6n7KIVES_ab2pRghvGFebbP?usp=sharing). I have switched to only uploading one Fusion 360 archive file since the exports are a bit tedious. This archive includes a mockup assembly of the CubeSat, that of coourse is not how it's meant to be put together, but serves as a way to show all available parts. This is a WIP though, so there may be things that don't make sense. Use with caution. The "user parameters" for Fusion are stored separately in the bac_parameters_fusion360.csv file in this repo. They are made to be imported into Fusion using the ["Parameter I/O"](https://apps.autodesk.com/FUSION/en/Detail/Index?id=1801418194626000805) add in available on the Autodesk App Store.

## Switch to FreeCAD / Ondsel NET July 2025
All of the designs in this repo will be redone in Ondsel in the latter half of 2025. After this point, the Fusion 360 files will not be maintained any longer.

## Fasteners
The idea here is to use as few tapped threads in aluminum as possible and use nuts and washers instead. For prototyping, any M3 hardware will do. For testing and flight, vibration resistant hardware like Bellevillle washers and Aerotight nuts are suggested as an alternative to thread locking adhesives. There will be a few spots that won't accomodate a nut; I work on figuring out how to mark them (this will probably be included in an improved version of this documentation further down the line).

## Recommended Hardware
### Socket Head Screws
- Development: ISO 14579 or ISO 14580, M3, Torx or Hex
- Flight: ISO 14580, M3, Torx, A2/304 stainless steel

### Nuts
- Development: ISO 4032, M3
- Flight: ISO 7042 or Aerotight Lock Nut, M3, A1 stainless steel

### Washers
- Development: ISO 7092
- Flight: DIN EN 16983 6mm OD Disc Spring Washers (Belleville Washer), A1 stainless steel

### Dowel Pins
- Development: 2.5mm brass or stainless steel rod, cut to 14-16mm
- Flight: ISO 2338 dowel pin, A1 stainless steel, 15mm

### Alignment Shims
- 1 mm x 3 to 5 mm brass flat stock, cut to about 20 mm length

## Fastener Lengths
- Rail to board clamp: 18mm
- Rail to EPS bolt: 14mm
- EPS PCB: 30mm

## Recommended Threadlockers
In some places, the use of nuts will not be possible. There, stacking the screws will be necessary for testing and flight. These are commonly used, low-outgassing thread adhesives:
- Vibra-Tite VC3
- Loctite 271
- 3M 2216

Please consult [outgassing.nasa.gov](https://outgassing.nasa.gov) for more info on the topic.
