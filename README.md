# PDF Processor (Proof of Concept)

## Sample call

```
POST /v1/pdf HTTP/1.1
Content-Type: application/pdf
Content-Length: 13125

%PDF-1.3
%âãÏÓ
1 0 obj
... whatever comes in a PDF
```

## Ideas
- Allow a mapping function to be passed at some point based on endpoint
-