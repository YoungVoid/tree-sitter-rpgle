; ===== Core Structure =====

(source_file) @module
(declaration) @keyword
(dcl_ds) @keyword

; ===== Identifiers =====

(identifier) @variable

; Identifier inside function call head
(function_call
  (identifier) @function)

; Identifier inside assignment LHS
(assignment
  (identifier) @variable.parameter)

; ===== Literals =====

(number) @number
(string) @string
(literal) @constant

; ===== Expressions =====

(binary_expression) @operator
(argument_list) @punctuation.bracket

; ===== Comments =====

(comment) @comment

; ===== Builtins =====

(builtin) @function.builtin

; ===== Errors =====

(ERROR) @error

; ===== TEMP   =====
;(expression_statement) @constant.builtin
;(binary_expression) @typeI
