// Prints the boxes of any text Apple's on-device Vision finds in an image, as "x y w h" fractions (origin top-left).
import Vision
import AppKit
let path = CommandLine.arguments[1]
guard let img = NSImage(contentsOfFile: path), let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { exit(1) }
let req = VNRecognizeTextRequest()
req.recognitionLevel = .accurate
req.usesLanguageCorrection = false
try VNImageRequestHandler(cgImage: cg).perform([req])
for o in req.results ?? [] {
    let b = o.boundingBox
    print(b.minX, 1 - b.maxY, b.width, b.height)
}
