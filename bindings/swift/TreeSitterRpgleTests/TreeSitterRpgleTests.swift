import XCTest
import SwiftTreeSitter
import TreeSitterRpgle

final class TreeSitterRpgleTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_rpgle())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading RPGLE grammar")
    }
}
