package tree_sitter_rpgle_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_rpgle "github.com/youngvoid/tree-sitter-rpgle/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_rpgle.Language())
	if language == nil {
		t.Errorf("Error loading RPGLE grammar")
	}
}
