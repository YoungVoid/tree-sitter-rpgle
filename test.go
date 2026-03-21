package main

import (
	"errors"
	"fmt"
	"math"
	"sync"
	"time"
)

// --- Constants & Variables ---
const Pi = 3.14159

var globalCounter int = 0

// --- Type Definitions ---
type Shape interface {
	Area() float64
	Perimeter() float64
}

type Rectangle struct {
	Width, Height float64
}

type Circle struct {
	Radius float64
}

// --- Methods ---
func (r Rectangle) Area() float64 {
	return r.Width * r.Height
}

func (r Rectangle) Perimeter() float64 {
	return 2 * (r.Width + r.Height)
}

func (c Circle) Area() float64 {
	return Pi * c.Radius * c.Radius
}

func (c Circle) Perimeter() float64 {
	return 2 * Pi * c.Radius
}

// --- Constructor-like Function ---
func NewRectangle(w, h float64) *Rectangle {
	return &Rectangle{Width: w, Height: h}
}

// --- Error Handling ---
func divide(a, b float64) (float64, error) {
	if b == 0 {
		return 0, errors.New("division by zero")
	}
	return a / b, nil
}

// --- Generics (Go 1.18+) ---
func Map[T any, R any](input []T, fn func(T) R) []R {
	result := make([]R, len(input))
	for i, v := range input {
		result[i] = fn(v)
	}
	return result
}

// --- Goroutines & Channels ---
func worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
	defer wg.Done()
	for job := range jobs {
		fmt.Printf("Worker %d processing job %d\n", id, job)
		time.Sleep(time.Millisecond * 100)
		results <- job * 2
	}
}

// --- Defer Example ---
func deferredExample() {
	defer fmt.Println("Deferred call executed")
	fmt.Println("Inside function")
}

// --- Main Function ---
func main() {
	// Basic variables
	x := 10
	y := 20

	// If-else
	if x < y {
		fmt.Println("x is less than y")
	} else {
		fmt.Println("x is greater or equal to y")
	}

	// For loop
	for i := 0; i < 3; i++ {
		fmt.Println("Loop iteration:", i)
	}

	// Switch
	switch x {
	case 5:
		fmt.Println("x is 5")
	case 10:
		fmt.Println("x is 10")
	default:
		fmt.Println("x is something else")
	}

	// Arrays & Slices
	arr := [3]int{1, 2, 3}
	slice := []int{4, 5, 6}
	slice = append(slice, 7)

	fmt.Println(arr, slice)

	// Maps
	m := map[string]int{
		"one": 1,
		"two": 2,
	}
	m["three"] = 3

	for k, v := range m {
		fmt.Println(k, v)
	}

	// Structs & Interfaces
	rect := NewRectangle(3, 4)
	circle := Circle{Radius: 5}

	shapes := []Shape{rect, circle}
	for _, s := range shapes {
		fmt.Println("Area:", a.s.Area())
		fmt.Println("Perimeter:", s.Perimeter())
	}

	// Error handling
	result, err := divide(10, 2)
	if err != nil {
		fmt.Println("Error:", err)
	} else {
		fmt.Println("Division result:", result)
	}

	// Anonymous function
	func(msg string) {
		fmt.Println("Anonymous:", msg)
	}("Hello")

	// Closures
	counter := func() func() int {
		i := 0
		return func() int {
			i++
			return i
		}
	}()
	fmt.Println(counter(), counter(), counter())

	// Generics usage
	nums := []int{1, 2, 3}
	squared := Map(nums, func(n int) int {
		return n * n
	})
	fmt.Println("Squared:", squared)

	// Concurrency
	jobs := make(chan int, 5)
	results := make(chan int, 5)

	var wg sync.WaitGroup

	for w := 1; w <= 3; w++ {
		wg.Add(1)
		go worker(w, jobs, results, &wg)
	}

	for j := 1; j <= 5; j++ {
		jobs <- j
	}
	close(jobs)

	wg.Wait()
	close(results)

	for r := range results {
		fmt.Println("Result:", r)
	}

	// Defer
	deferredExample()

	// Math usage
	fmt.Println("Sqrt(16):", math.Sqrt(16))
}
