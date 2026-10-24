const CAMPUS = {
  "nodes": [
    {
      "id": "GATE",
      "name": "Main Gate",
      "kind": "Entrance",
      "x": 80,
      "y": 320
    },
    {
      "id": "ADMIN",
      "name": "Administration",
      "kind": "Office",
      "x": 220,
      "y": 140
    },
    {
      "id": "REG",
      "name": "Registrar Office",
      "kind": "Office",
      "x": 380,
      "y": 80
    },
    {
      "id": "C101",
      "name": "Classroom 101",
      "kind": "Classroom",
      "x": 240,
      "y": 300
    },
    {
      "id": "C102",
      "name": "Classroom 102",
      "kind": "Classroom",
      "x": 410,
      "y": 270
    },
    {
      "id": "LIB",
      "name": "Central Library",
      "kind": "Library",
      "x": 550,
      "y": 140
    },
    {
      "id": "CS",
      "name": "Computer Science",
      "kind": "Department",
      "x": 730,
      "y": 100
    },
    {
      "id": "LAB",
      "name": "Computer Lab",
      "kind": "Laboratory",
      "x": 740,
      "y": 280
    },
    {
      "id": "QUAD",
      "name": "Central Quad",
      "kind": "Open space",
      "x": 460,
      "y": 440
    },
    {
      "id": "CAFE",
      "name": "Student Cafe",
      "kind": "Facility",
      "x": 240,
      "y": 500
    },
    {
      "id": "ENG",
      "name": "Engineering",
      "kind": "Department",
      "x": 640,
      "y": 490
    },
    {
      "id": "PHYS",
      "name": "Physics Lab",
      "kind": "Laboratory",
      "x": 850,
      "y": 450
    },
    {
      "id": "MED",
      "name": "Health Centre",
      "kind": "Office",
      "x": 80,
      "y": 630
    },
    {
      "id": "HALL",
      "name": "Lecture Hall",
      "kind": "Classroom",
      "x": 430,
      "y": 650
    },
    {
      "id": "HOST",
      "name": "Residence Hall",
      "kind": "Residence",
      "x": 690,
      "y": 680
    },
    {
      "id": "SPORT",
      "name": "Sports Centre",
      "kind": "Facility",
      "x": 880,
      "y": 650
    }
  ],
  "edges": [
    {
      "a": "GATE",
      "b": "ADMIN",
      "distance": 240,
      "accessible": true,
      "crowd": 0.1
    },
    {
      "a": "GATE",
      "b": "C101",
      "distance": 170,
      "accessible": true,
      "crowd": 0.4
    },
    {
      "a": "GATE",
      "b": "MED",
      "distance": 330,
      "accessible": true,
      "crowd": 0.05
    },
    {
      "a": "ADMIN",
      "b": "REG",
      "distance": 180,
      "accessible": true,
      "crowd": 0.1
    },
    {
      "a": "ADMIN",
      "b": "C101",
      "distance": 180,
      "accessible": true,
      "crowd": 0.2
    },
    {
      "a": "REG",
      "b": "LIB",
      "distance": 190,
      "accessible": true,
      "crowd": 0.1
    },
    {
      "a": "C101",
      "b": "C102",
      "distance": 180,
      "accessible": false,
      "crowd": 0.2
    },
    {
      "a": "C101",
      "b": "CAFE",
      "distance": 210,
      "accessible": true,
      "crowd": 0.7
    },
    {
      "a": "C102",
      "b": "LIB",
      "distance": 200,
      "accessible": true,
      "crowd": 0.25
    },
    {
      "a": "C102",
      "b": "QUAD",
      "distance": 190,
      "accessible": true,
      "crowd": 0.65
    },
    {
      "a": "LIB",
      "b": "CS",
      "distance": 190,
      "accessible": true,
      "crowd": 0.15
    },
    {
      "a": "LIB",
      "b": "LAB",
      "distance": 240,
      "accessible": false,
      "crowd": 0.1
    },
    {
      "a": "CS",
      "b": "LAB",
      "distance": 190,
      "accessible": true,
      "crowd": 0.15
    },
    {
      "a": "LAB",
      "b": "PHYS",
      "distance": 220,
      "accessible": true,
      "crowd": 0.3
    },
    {
      "a": "LAB",
      "b": "ENG",
      "distance": 250,
      "accessible": true,
      "crowd": 0.3
    },
    {
      "a": "QUAD",
      "b": "ENG",
      "distance": 200,
      "accessible": true,
      "crowd": 0.8
    },
    {
      "a": "QUAD",
      "b": "CAFE",
      "distance": 240,
      "accessible": true,
      "crowd": 0.9
    },
    {
      "a": "QUAD",
      "b": "HALL",
      "distance": 220,
      "accessible": false,
      "crowd": 0.5
    },
    {
      "a": "CAFE",
      "b": "MED",
      "distance": 220,
      "accessible": true,
      "crowd": 0.3
    },
    {
      "a": "CAFE",
      "b": "HALL",
      "distance": 260,
      "accessible": true,
      "crowd": 0.4
    },
    {
      "a": "ENG",
      "b": "PHYS",
      "distance": 220,
      "accessible": true,
      "crowd": 0.25
    },
    {
      "a": "ENG",
      "b": "HOST",
      "distance": 210,
      "accessible": true,
      "crowd": 0.2
    },
    {
      "a": "PHYS",
      "b": "SPORT",
      "distance": 220,
      "accessible": true,
      "crowd": 0.2
    },
    {
      "a": "HALL",
      "b": "HOST",
      "distance": 270,
      "accessible": true,
      "crowd": 0.1
    },
    {
      "a": "HOST",
      "b": "SPORT",
      "distance": 200,
      "accessible": true,
      "crowd": 0.15
    }
  ]
};
if (typeof module !== 'undefined') module.exports = CAMPUS;
