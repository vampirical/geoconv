# geoconv
CLI tool to convert between different geometry formats. Supports GeoJSON, WKT, and ArcGIS JSON.

# usage

    Usage: geoconv [options] <output-format>

      Convert between different geometry formats. Supported formats: arcgis, geojson, wkt

      Options:

        -V, --version                output the version number
        -i, --input-format [format]  Input format. (default: auto)
        -h, --help                   output usage information

# examples

    > echo "POINT (30 10)" | geoconv geojson
    {"type":"Point","coordinates":[30,10],"bbox":[30,10,30,10]}
