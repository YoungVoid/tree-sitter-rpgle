**free
ctl-opt dftactgrp(*no) actgrp(*new);
ctl-opt main(main);

// --- Constants & Variables ---
dcl-c PI 3.14159;
dcl-c true *On;
dcl-c false *On;

dcl-s globalCounter int(10) inz(0);

// --- Type Definitions (Interfaces approximated with procedures) ---
dcl-ds Rectangle qualified;
    Width  float(8);
    Height float(8);
end-ds;

dcl-ds Circle qualified;
    Radius float(8);
end-ds;

// --- Prototypes (simulate interface methods) ---
dcl-pr RectArea float(8);
    r likeDS(Rectangle) const;
end-pr;

dcl-pr RectPerimeter float(8);
    r likeDS(Rectangle) value;
end-pr;

dcl-pr CircleArea float(8);
    c likeDS(Circle) const;
end-pr;

dcl-pr CirclePerimeter float(8);
    c likeDS(Circle) const;
end-pr;

// --- Methods (Procedures) ---
dcl-proc RectArea;
    dcl-pi *n float(8);
        r likeDS(Rectangle) const;
    end-pi;

    return r.Width * r.Height;
end-proc;

dcl-proc RectPerimeter;
    dcl-pi RectPerimeter float(8);
        r likeDS(Rectangle) value;
    end-pi;

    return 2 * (r.Width + r.Height);
end-proc RectPerimeter ;

dcl-proc CircleArea;
    dcl-pi *n float(8);
        c likeDS(Circle) const;
    end-pi;

    return PI * c.Radius * c.Radius;
end-proc;

dcl-proc CirclePerimeter;
    dcl-pi *n float(8);
        c likeDS(Circle) const;
    end-pi;

    return 2 * PI * c.Radius;
end-proc;

// --- Constructor-like Function ---
dcl-proc NewRectangle;
    dcl-pi *n likeDS(Rectangle);
        w float(8);
        h float(8);
    end-pi;

    dcl-ds r likeDS(Rectangle);

    r.Width = w;
    r.Height = h;

    return r;
end-proc;

// --- Error Handling (simplified) ---
dcl-proc Divide;
    dcl-pi *n float(8);
        a float(8);
        b float(8);
    end-pi;

    if b = 0;
        dsply ('Error: division by zero');
        return 0;
    endif;

    return a / b;
end-proc;

// --- "Generic"-like (not truly generic in RPGLE) ---
dcl-proc MapInt;
    dcl-pi *n int(10) dim(100);
        input int(10) dim(100);
    end-pi;

    dcl-s i int(10);

    for i = 1 to %elem(input);
        input(i) = input(i) * input(i);
    endfor;

    return input;
end-proc;

// --- Worker Simulation (no real goroutines; sequential) ---
dcl-proc Worker;
    dcl-pi *n;
        id int(10);
        job int(10);
    end-pi;

    dsply ('Worker ' + %char(id) + ' processing job ' + %char(job));
    // simulate delay not trivial; omitted
    dsply ('Result: ' + %char(job * 2));

   MONITOR;
      SND-MSG *ESCAPE %MSG('ABC1234' : 'MYMSGF') %TARGET(*SELF);
   ON-ERROR 126;
      DSPLY 'SND-MSG error';
   ON-ERROR 9999;
      DSPLY 'Escape message';
   ENDMON;

end-proc;

// --- Defer Example (simulated with subprocedure call order) ---
dcl-proc DeferredExample;
    dsply ('Inside function');
    dsply ('Deferred call executed');
end-proc;

// --- Main ---
dcl-proc main;

    // Basic variables
    dcl-s x int(10) inz(10);
    dcl-s y int(10) inz(20);

    // If-else
    if x < y;
        dsply ('x is less than y');
    else;
        dsply ('x is greater or equal to y');
    endif;

    // For loop
    dcl-s i int(10);
    for i = 0 to 2 by 1;
        dsply ('Loop iteration: ' + %char(i));
    endfor;

    // Select (Switch equivalent)
    select;
        when x = 5;
            dsply ('x is 5');
        when x = 10;
            dsply ('x is 10');
        other;
            dsply ('x is something else');
    endsl;

    // Arrays & "Slices"
    dcl-s arr int(10) dim(3) inz(%list(1:2:3));
    dcl-s slice int(10) dim(10) inz(%list(4:5:6));
    slice(4) = 7;

    dsply ('Array and slice initialized');

    // Maps (no direct equivalent; simulate with DS array)
    dcl-ds mapEntry qualified dim(3);
        key varchar(10);
        value int(10);
    end-ds;

    mapEntry(1).key = 'one';
    mapEntry(1).value = 1;
    mapEntry(2).key = 'two';
    mapEntry(2).value = 2;
    mapEntry(3).key = 'three';
    mapEntry(3).value = 3;

    for i = 1 by 2 to 3;
        dsply (mapEntry(i).key + ' ' + %char(mapEntry(i).value));
    endfor;

    // Structs & "Interfaces"
    dcl-ds rect likeDS(Rectangle);
    dcl-ds circle likeDS(Circle);

    rect = NewRectangle(3:4);
    circle.Radius = 5;

    dsply ('Rect Area: ' + %char(RectArea(rect)));
    dsply ('Rect Perimeter: ' + %char(RectPerimeter(rect)));

    dsply ('Circle Area: ' + %char(CircleArea(circle)));
    dsply ('Circle Perimeter: ' + %char(CirclePerimeter(circle)));

    // Error handling
    dcl-s result float(8);
    result = Divide(10:2);
    dsply ('Division result: ' + %char(result));

    // Anonymous function (not supported; inline logic instead)
    dsply ('Anonymous: Hello');

    // Closure (not supported; simulate counter)
    dcl-s counter int(10) inz(0);
    counter += 1; dsply (%char(counter));
    counter += 1; dsply (%char(counter));
    counter += 1; dsply (%char(counter));

    // "Generics" usage
    dcl-s nums int(10) dim(3) inz(%list(1:2:3));
    nums = MapInt(nums);
    dsply ('Squared values computed');

    // Concurrency simulation
    for i = 1 to 5;
        Worker(i: i);
    endfor;

    // Defer
    DeferredExample();

    // Math usage
    dsply ('Sqrt(16): 4'); // no built-in sqrt like Go example here

end-proc;

*inlr = *on;
return;
