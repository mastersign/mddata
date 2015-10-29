# Section 1

* List
    + Entry A
    + Entry B
* Property X: `Value`
    + Subproperty X.1: X1
    + Subproperty X.2: X2
* Property Y
    + Subproperty Y.1: Y1
    + Subproperty Y.2: Y2

## Chapter 1.1

* Typ: chapter
* Number: 1.1

### Paragraph 1.1.1

* list
    + a
        - x: 3
        - y: 4
    + b
        - x: 5
        - y: 6

Absolute: headline(x), list(x), name(), value()

Relative: parent(x), path/x, ./path/x

Implizite Auflistung von Elementnamen:

<!-- #data-table /Section 1/List/* -->
<!--
Entry A
Entry B
-->

Implizite Auflistung von Elementnamen aus dem Abschnitt

<!-- #data-table list/a/* -->
<!--
x
y
-->

Explizite Auflistung von Elementnamen:

<!-- #data-table
SELECT name() AS Entries
FROM /Section 1/List/*
-->
<!--
Entries
=======
Entry A
Entry B
-->

Auflistung von Elementnamen und -werten:

<!-- #data-table
SELECT parent(1) AS List, value() AS Value
FROM Paragraph 1.1.1/list/*/x
-->
<!--
List, Value
===========
a, 3
b, 5
-->