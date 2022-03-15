---
title: 使用Go操作文件
date: 2022-03-14 20:11:25
tags:
- Linux
- Docker
categories:
- 博文
- 笔记
toc: true
fancybox: true
---
# 一切皆文件
UNIX世界的一个基石观点是一切皆文件。我们不需要知道文件描述符映射的，由操作系统的设备驱动抽象出来的是什么。操作系统以文件的形式向我们提供了访问设备的接口。

Go语言中的读/写接口也类似。我们仅仅简单的读/写字节，并不需要理解reader从何处及如何读数据，或者writer将数据写入到了何处。在`/dev`下能找到可用的设备。有些可能需要提权访问。
![](/images/golang/go_files.png)

# 1. 基础文件操作
## 1.1 创建空文件
```go
package main

import (
    "log"
    "os"
)

var (
    newFile *os.File
    err     error
)

func main() {
    newFile, err = os.Create("test.txt")
    if err != nil {
        log.Fatal(err)
    }
    log.Println(newFile)
    newFile.Close()
}
```

## 1.2 截断文件（Truncate）
```go
package main

import (
    "log"
    "os"
)

func main() {
	// 截断文件至100字节。如果文件小于100字节，则原始内容保留在前并在其后补null字节。
	// 如果文件大于100字节，超过100字节的不删将丢弃。
	// 那么不论哪种情况，我们都将得到长度为100字节的内容。
	// 第二个参数传0，则将清空整个文件。

    err := os.Truncate("test.txt", 100)
    if err != nil {
        log.Fatal(err)
    }
}
```

## 1.3 获取文件信息
```go
package main

import (
    "fmt"
    "log"
    "os"
)

var (
    fileInfo os.FileInfo
    err      error
)

func main() {
    // Stat returns file info. It will return
    // an error if there is no file.
    fileInfo, err = os.Stat("test.txt")
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println("File name:", fileInfo.Name()) // File name: test.txt
    fmt.Println("Size in bytes:", fileInfo.Size()) // Size in bytes: 12
    fmt.Println("Permissions:", fileInfo.Mode()) // Permissions: -rw-r--r--
    fmt.Println("Last modified:", fileInfo.ModTime()) // Last modified: 2022-03-14 20:42:22.440137408 +0800 CST
    fmt.Println("Is Directory: ", fileInfo.IsDir()) // Is Directory:  false
    fmt.Printf("System interface type: %T\n", fileInfo.Sys()) // System interface type: *syscall.Stat_t
    fmt.Printf("System info: %+v\n\n", fileInfo.Sys()) // System info: &{Dev:66306 Ino:11021648 ......
}
```

## 1.4 重命名/移动文件
```go
package main

import (
    "log"
    "os"
)

func main() {
    originalPath := "test.txt"
    newPath := "test2.txt"
    err := os.Rename(originalPath, newPath)
    if err != nil {
        log.Fatal(err)
    }
}
```

## 1.5 删除文件
```go
package main

import (
    "log"
    "os"
)

func main() {
    err := os.Remove("test.txt")
    if err != nil {
		log.Fatal(err)
	}
}
```

## ## 1.6 打开/关闭文件
```go
package main

import (
    "log"
    "os"
)

func main() {
	// Simple read only open. We will cover actually reading
	// and writing to files in examples further down the page
	file, err := os.Open("test.txt")
	if err != nil {
		log.Fatal(err)
	}
	file.Close()

	// OpenFile with more options. Last param is the permission mode
	// Second param is the attributes when opening
	file, err = os.OpenFile("test.txt", os.O_APPEND, 0666)
	if err != nil {
		log.Fatal(err)
	}
	file.Close()

	// Use these attributes individually or combined
	// with an OR for second arg of OpenFile()
	// e.g. os.O_CREATE|os.O_APPEND
	// or os.O_CREATE|os.O_TRUNC|os.O_WRONLY

	// os.O_RDONLY // Read only
	// os.O_WRONLY // Write only
	// os.O_RDWR // Read and write
	// os.O_APPEND // Append to end of file
	// os.O_CREATE // Create is none exist
	// os.O_TRUNC // Truncate file when opening
}
```

## 1.7 检查文件是否存在
```go
package main

import (
    "log"
    "os"
)

var (
    fileInfo *os.FileInfo
    err      error
)

func main() {
    // Stat returns file info. It will return
    // an error if there is no file.
    fileInfo, err := os.Stat("test.txt")
    if err != nil {
        if os.IsNotExist(err) {
            log.Fatal("File does not exist.")
        }
    }
    log.Printf("File does exist. File information:\n%s", fileInfo)
}
```

## 1.8 检查读/写权限
```go
package main

import (
    "log"
    "os"
)

func main() {
    // Test write permissions. It is possible the file
    // does not exist and that will return a different
    // error that can be checked with os.IsNotExist(err)
    file, err := os.OpenFile("test.txt", os.O_WRONLY, 0666)
    if err != nil {
        if os.IsPermission(err) {
            log.Println("Error: Write permission denied.")
        }
    }
    file.Close()

    // Test read permissions
    file, err = os.OpenFile("test.txt", os.O_RDONLY, 0666)
    if err != nil {
        if os.IsPermission(err) {
            log.Println("Error: Read permission denied.")
        }
    }
    file.Close()
}
```

## 1.9 修改权限/拥有者/时间戳
```go
package main

import (
    "log"
    "os"
    "time"
)

func main() {
    // Change perrmissions using Linux style
    err := os.Chmod("test.txt", 0777)
    if err != nil {
        log.Println(err)
    }

    // Change ownership
    err = os.Chown("test.txt", os.Getuid(), os.Getgid())
    if err != nil {
        log.Println(err)
    }

    // Change timestamps
    twoDaysFromNow := time.Now().Add(48 * time.Hour)
    lastAccessTime := twoDaysFromNow
    lastModifyTime := twoDaysFromNow
    err = os.Chtimes("test.txt", lastAccessTime, lastModifyTime)
    if err != nil {
        log.Println(err)
    }
}
```

## 1.10 创建硬链接/软链接
典型的文件就是一个指向硬盘某个位置的指针，我们称之为`inode`。硬链接会创建一个新的指针，指向相同的位置。只有当所有链接都删除时，文件才会真的被从硬盘上物理删除。硬链接只能在相同的文件系统中创建。
符号链接或软链接，稍有不同，它并不直接指向磁盘上的位置。软链接仅仅通过文件名引用其他文件。它可以指向不同的文件系统上的文件。
```go
package main

import (
    "os"
    "log"
    "fmt"
)

func main() {
    // Create a hard link
    // You will have two file names that point to the same contents
    // Changing the contents of one will change the other
    // Deleting/renaming one will not affect the other
    err := os.Link("original.txt", "original_also.txt")
    if err != nil {
        log.Fatal(err)
    }

fmt.Println("creating sym")
    // Create a symlink
    err = os.Symlink("original.txt", "original_sym.txt")
    if err != nil {
        log.Fatal(err)
    }

    // Lstat will return file info, but if it is actually
    // a symlink, it will return info about the symlink.
    // It will not follow the link and give information
    // about the real file
    // Symlinks do not work in Windows
    fileInfo, err := os.Lstat("original_sym.txt")
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Link info: %+v", fileInfo)

    // Change ownership of a symlink only 
    // and not the file it points to
    err = os.Lchown("original_sym.txt", os.Getuid(), os.Getgid())
    if err != nil {
        log.Fatal(err)
    }
}
```

# 读/写文件
## 2.1 复制文件
```go
package main

import (
    "os"
    "log"
    "io"
)

// Copy a file
func main() {
    // Open original file
    originalFile, err := os.Open("test.txt")
    if err != nil {
        log.Fatal(err)
    }
    defer originalFile.Close()

    // Create new file
    newFile, err := os.Create("test_copy.txt")
    if err != nil {
        log.Fatal(err)
    }
    defer newFile.Close()

    // Copy the bytes to destination from source
    bytesWritten, err := io.Copy(newFile, originalFile)
    if err != nil {
        log.Fatal(err)
    }
    log.Printf("Copied %d bytes.", bytesWritten)
    
    // Commit the file contents
    // Flushes memory to disk
    err = newFile.Sync()
    if err != nil {
        log.Fatal(err)
    }
}
```

## 2.2 跳至指定位置（Seek）
```go
package main

import (
    "os"
    "fmt"
    "log"
)

func main() {
    file, _ := os.Open("test.txt")
    defer file.Close()

    // Offset is how many bytes to move
    // Offset can be positive or negative
    var offset int64 = 5

    // Whence is the point of reference for offset
    // 0 = Beginning of file
    // 1 = Current position
    // 2 = End of file
    var whence int = 0
    newPosition, err := file.Seek(offset, whence)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println("Just moved to 5:", newPosition)

    // Go back 2 bytes from current position
    newPosition, err = file.Seek(-2, 1)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println("Just moved back two:", newPosition)

    // Find the current position by getting the
    // return value from Seek after moving 0 bytes
    currentPosition, err := file.Seek(0, 1)
    fmt.Println("Current position:", currentPosition)

    // Go to beginning of file
    newPosition, err = file.Seek(0, 0)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println("Position after seeking 0,0:", newPosition)
}
```

## 2.3 向文件写入字节
```go
package main

import (
    "os"
    "log"
)

func main() {
    // Open a new file for writing only
    file, err := os.OpenFile(
        "test.txt",
        os.O_WRONLY|os.O_TRUNC|os.O_CREATE,
        0666,
    )
    if err != nil {
        log.Fatal(err)
    }
    defer file.Close()

    // Write bytes to file
    byteSlice := []byte("Bytes!\n")
    bytesWritten, err := file.Write(byteSlice)
    if err != nil {
        log.Fatal(err)
    }
    log.Printf("Wrote %d bytes.\n", bytesWritten)
}
```

## 2.4 快速写入文件
```go
package main

import (
    "io/ioutil"
    "log"
)

func main() {
    err := ioutil.WriteFile("test.txt", []byte("Hi\n"), 0666)
    if err != nil {
        log.Fatal(err)
    }
}
```

## 2.5 使用缓冲写（Buffered Writer）
```go
package main

import (
    "log"
    "os"
    "bufio"
)

func main() {
    // Open file for writing
    file, err := os.OpenFile("test.txt", os.O_WRONLY, 0666)
    if err != nil {
        log.Fatal(err)
    }
    defer file.Close()

    // Create a buffered writer from the file
    bufferedWriter := bufio.NewWriter(file)

    // Write bytes to buffer
    bytesWritten, err := bufferedWriter.Write(
        []byte{65, 66, 67},
    )
    if err != nil {
        log.Fatal(err)
    }
    log.Printf("Bytes written: %d\n", bytesWritten)

    // Write string to buffer
    // Also available are WriteRune() and WriteByte()   
    bytesWritten, err = bufferedWriter.WriteString(
        "Buffered string\n",
    )
    if err != nil {
        log.Fatal(err)
    }
    log.Printf("Bytes written: %d\n", bytesWritten)

    // Check how much is stored in buffer waiting
    unflushedBufferSize := bufferedWriter.Buffered()
    log.Printf("Bytes buffered: %d\n", unflushedBufferSize)

    // See how much buffer is available
    bytesAvailable := bufferedWriter.Available()
    if err != nil {
        log.Fatal(err)
    }
    log.Printf("Available buffer: %d\n", bytesAvailable)

    // Write memory buffer to disk
    bufferedWriter.Flush()

    // Revert any changes done to buffer that have
    // not yet been written to file with Flush()
    // We just flushed, so there are no changes to revert
    // The writer that you pass as an argument
    // is where the buffer will output to, if you want
    // to change to a new writer
    bufferedWriter.Reset(bufferedWriter) 

    // See how much buffer is available
    bytesAvailable = bufferedWriter.Available()
    if err != nil {
        log.Fatal(err)
    }
    log.Printf("Available buffer: %d\n", bytesAvailable)

    // Resize buffer. The first argument is a writer
    // where the buffer should output to. In this case
    // we are using the same buffer. If we chose a number
    // that was smaller than the existing buffer, like 10
    // we would not get back a buffer of size 10, we will
    // get back a buffer the size of the original since
    // it was already large enough (default 4096)
    bufferedWriter = bufio.NewWriterSize(
        bufferedWriter,
        8000,
    )

    // Check available buffer size after resizing
    bytesAvailable = bufferedWriter.Available()
    if err != nil {
        log.Fatal(err)
    }
    log.Printf("Available buffer: %d\n", bytesAvailable)
}
```

## 最多读文件的n个字节
```go
package main

import (
    "os"
    "log"
)

func main() {
    // Open file for reading
    file, err := os.Open("test.txt")
    if err != nil {
        log.Fatal(err)
    }
    defer file.Close()

    // Read up to len(b) bytes from the File
    // Zero bytes written means end of file
    // End of file returns error type io.EOF
    byteSlice := make([]byte, 16)
    bytesRead, err := file.Read(byteSlice)
    if err != nil {
        log.Fatal(err)
    }
    log.Printf("Number of bytes read: %d\n", bytesRead)
    log.Printf("Data read: %s\n", byteSlice)
}
```

## 2.7 只读取文件的n个字节
```go
package main

import (
    "os"
    "log"
    "io"
)

func main() {
    // Open file for reading
    file, err := os.Open("test.txt")
    if err != nil {
        log.Fatal(err)
    }

    // The file.Read() function will happily read a tiny file in to a large
    // byte slice, but io.ReadFull() will return an
    // error if the file is smaller than the byte slice.
    byteSlice := make([]byte, 2)
    numBytesRead, err := io.ReadFull(file, byteSlice)
    if err != nil {
        log.Fatal(err)
    }
    log.Printf("Number of bytes read: %d\n", numBytesRead)
    log.Printf("Data read: %s\n", byteSlice)
}
```

## 2.8 至少读取文件的n个字节
```go
package main

import (
    "os"
    "log"
    "io"
)

func main() {
    // Open file for reading
    file, err := os.Open("test.txt")
    if err != nil {
        log.Fatal(err)
    }

    byteSlice := make([]byte, 512)
    minBytes := 8
    // io.ReadAtLeast() will return an error if it cannot
    // find at least minBytes to read. It will read as
    // many bytes as byteSlice can hold. 
    numBytesRead, err := io.ReadAtLeast(file, byteSlice, minBytes)
    if err != nil {
        log.Fatal(err)
    }
    log.Printf("Number of bytes read: %d\n", numBytesRead)
    log.Printf("Data read: %s\n", byteSlice)
}
```

## 2.9 读文件的全部字节
```go
package main

import (
    "os"
    "log"
    "fmt"
    "io/ioutil"
)

func main() {
    // Open file for reading
    file, err := os.Open("test.txt")
    if err != nil {
        log.Fatal(err)
    }

    // os.File.Read(), io.ReadFull(), and
    // io.ReadAtLeast() all work with a fixed
    // byte slice that you make before you read

    // ioutil.ReadAll() will read every byte
    // from the reader (in this case a file),
    // and return a slice of unknown slice
    data, err := ioutil.ReadAll(file)
    if err != nil {
        log.Fatal(err)
    }

    fmt.Printf("Data as hex: %x\n", data)
    fmt.Printf("Data as string: %s\n", data)
    fmt.Println("Number of bytes read:", len(data))
}
```

## 2.10 快速读取全部文件到内存
```go
package main

import (
    "log"
    "io/ioutil"
)

func main() {
    // Read file to byte slice
    data, err := ioutil.ReadFile("test.txt")
    if err != nil {
        log.Fatal(err)
    }

    log.Printf("Data read: %s\n", data)
}
```

## 2.11 使用缓冲读（Buffered Reader）
```go
package main

import (
    "os"
    "log"
    "bufio"
    "fmt"
)

func main() {
    // Open file and create a buffered reader on top
    file, err := os.Open("test.txt")
    if err != nil {
        log.Fatal(err)
    }
    bufferedReader := bufio.NewReader(file)

    // Get bytes without advancing pointer
    byteSlice := make([]byte, 5)
    byteSlice, err = bufferedReader.Peek(5)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Peeked at 5 bytes: %s\n", byteSlice)

    // Read and advance pointer
    numBytesRead, err := bufferedReader.Read(byteSlice)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Read %d bytes: %s\n", numBytesRead, byteSlice)

    // Ready 1 byte. Error if no byte to read
    myByte, err := bufferedReader.ReadByte()
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Read 1 byte: %c\n", myByte)     

    // Read up to and including delimiter
    // Returns byte slice
    dataBytes, err := bufferedReader.ReadBytes('\n') 
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Read bytes: %s\n", dataBytes)           

    // Read up to and including delimiter
    // Returns string   
    dataString, err := bufferedReader.ReadString('\n')
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Read string: %s\n", dataString)     

    // This example reads a few lines so test.txt
    // should have a few lines of text to work correct
}
```

## 2.12 使用Scanner读
`bufio`包有一个`Scanner`，它提供了一种方法使用指定的分隔符来逐项迭代文件内容。默认情况下，使用换行符`newline`来将文件拆分为若干行。在CSV文件中，使用逗号作为分隔符。`os.File`对象可以使用`bufio.Scanner`包装，用起来和缓存读相似。调用`Scan`函数读取下一行，调用`Text()`或`Bytes()`读取内容。
分隔符不是一个简单的字节或字符，有一个特殊的函数用来决定符合分隔，计算从何处开始算作下一行，指针向前移动多少，返回什么数据。若未提供自定义的`SplitFunc`函数，默认使用`ScanLines`函数。另外`bufio`包提供了`ScanRunes`和`ScanWords`函数。
```go
package main

import (
    "os"
    "log"
    "fmt"
    "bufio"
)

func main() {
    // Open file and create scanner on top of it
    file, err := os.Open("test.txt")
    if err != nil {
        log.Fatal(err)
    }
    scanner := bufio.NewScanner(file)

    // Default scanner is bufio.ScanLines. Lets use ScanWords.
    // Could also use a custom function of SplitFunc type
    scanner.Split(bufio.ScanWords)

    // Scan for next token. 
    success := scanner.Scan() 
    if success == false {
        // False on error or EOF. Check error
        err = scanner.Err()
        if err == nil {
            log.Println("Scan completed and reached EOF")
        } else {
            log.Fatal(err)
        }
    }

    // Get data from scan with Bytes() or Text()
    fmt.Println("First word found:", scanner.Text())

    // Call scanner.Scan() again to find next token
}
```

# 3. 归档
## 3.1 Zip归档
```go
// This example uses zip but standard library
// also supports tar archives
package main

import (
    "archive/zip"
    "log"
    "os"
)

func main() {
    // Create a file to write the archive buffer to
    // Could also use an in memory buffer.
    outFile, err := os.Create("test.zip")
    if err != nil {
        log.Fatal(err)
    }
    defer outFile.Close()

    // Create a zip writer on top of the file writer
    zipWriter := zip.NewWriter(outFile)


    // Add files to archive
    // We use some hard coded data to demonstrate,
    // but you could iterate through all the files
    // in a directory and pass the name and contents
    // of each file, or you can take data from your
    // program and write it write in to the archive
    // without 
    var filesToArchive = []struct {
        Name, Body string
    } {
        {"test.txt", "String contents of file"},
        {"test2.txt", "\x61\x62\x63\n"},
    }

    // Create and write files to the archive, which in turn
    // are getting written to the underlying writer to the
    // .zip file we created at the beginning
    for _, file := range filesToArchive {
            fileWriter, err := zipWriter.Create(file.Name)
            if err != nil {
                    log.Fatal(err)
            }
            _, err = fileWriter.Write([]byte(file.Body))
            if err != nil {
                    log.Fatal(err)
            }
    }

    // Clean up
    err = zipWriter.Close()
    if err != nil {
            log.Fatal(err)
    }
}
```

## 3.2 Zip解压
```go
// This example uses zip but standard library
// also supports tar archives
package main

import (
    "archive/zip"
    "log"
    "io"
    "os"
    "path/filepath"
)

func main() {
    // Create a reader out of the zip archive
    zipReader, err := zip.OpenReader("test.zip")
    if err != nil {
        log.Fatal(err)
    }
    defer zipReader.Close()

    // Iterate through each file/dir found in
    for _, file := range zipReader.Reader.File {
        // Open the file inside the zip archive
        // like a normal file
        zippedFile, err := file.Open()
        if err != nil {
            log.Fatal(err)
        }
        defer zippedFile.Close()
        
        // Specify what the extracted file name should be.
        // You can specify a full path or a prefix
        // to move it to a different directory. 
        // In this case, we will extract the file from
        // the zip to a file of the same name.
        targetDir := "./"
        extractedFilePath := filepath.Join(
            targetDir,
            file.Name,
        )

        // Extract the item (or create directory)
        if file.FileInfo().IsDir() {
            // Create directories to recreate directory
            // structure inside the zip archive. Also
            // preserves permissions
            log.Println("Creating directory:", extractedFilePath)
            os.MkdirAll(extractedFilePath, file.Mode())
        } else {
            // Extract regular file since not a directory
            log.Println("Extracting file:", file.Name)

            // Open an output file for writing
            outputFile, err := os.OpenFile(
                extractedFilePath,
                os.O_WRONLY|os.O_CREATE|os.O_TRUNC,
                file.Mode(),
            )
            if err != nil {
                log.Fatal(err)
            }
            defer outputFile.Close()

            // "Extract" the file by copying zipped file
            // contents to the output file
            _, err = io.Copy(outputFile, zippedFile)
            if err != nil {
                log.Fatal(err)
            }
        }
    }
}
```

# 4. 压缩
## 4.1 文件压缩
```go
// This example uses gzip but standard library also
// supports zlib, bz2, flate, and lzw
package main

import (
    "os"
    "compress/gzip"
    "log"
)

func main() {
    // Create .gz file to write to
    outputFile, err := os.Create("test.txt.gz")
    if err != nil {
        log.Fatal(err)
    }

    // Create a gzip writer on top of file writer
    gzipWriter := gzip.NewWriter(outputFile)
    defer gzipWriter.Close()

    // When we write to the gzip writer
    // it will in turn compress the contents
    // and then write it to the underlying
    // file writer as well
    // We don't have to worry about how all
    // the compression works since we just
    // use it as a simple writer interface
    // that we send bytes to
    _, err = gzipWriter.Write([]byte("Gophers rule!\n"))
    if err != nil {
        log.Fatal(err)
    }

    log.Println("Compressed data written to file.") 
}
```

## 4.1 文件解压缩
```go
// This example uses gzip but standard library also
// supports zlib, bz2, flate, and lzw
package main

import (
    "compress/gzip"
    "log"
    "io"
    "os"
)

func main() {
    // Open gzip file that we want to uncompress
    // The file is a reader, but we could use any
    // data source. It is common for web servers
    // to return gzipped contents to save bandwidth
    // and in that case the data is not in a file
    // on the file system but is in a memory buffer
    gzipFile, err := os.Open("test.txt.gz")
    if err != nil {
        log.Fatal(err)
    }

    // Create a gzip reader on top of the file reader
    // Again, it could be any type reader though
    gzipReader, err := gzip.NewReader(gzipFile)
    if err != nil {
        log.Fatal(err)
    }
    defer gzipReader.Close()

    // Uncompress to a writer. We'll use a file writer
    outfileWriter, err := os.Create("unzipped.txt")
    if err != nil {
        log.Fatal(err)
    }
    defer outfileWriter.Close()

    // Copy contents of gzipped file to output file
    _, err = io.Copy(outfileWriter, gzipReader)
    if err != nil {
        log.Fatal(err)
    }
}
```

# 5. 其他操作
## 5.1 临时文件和目录
`ioutil`包提提供了两个函数`TempDir()`和`TempFile()`。使用完毕后，调用方需要负责主动删除临时文件。这两个函数唯一提供的一项便利是在传空参数时，它会在系统的`/tmp`目录下自动创建。
```go
package main

import (
     "os"
     "io/ioutil"
     "log"
     "fmt"
)

func main() {
     // Create a temp dir in the system default temp folder
     tempDirPath, err := ioutil.TempDir("", "myTempDir")
     if err != nil {
          log.Fatal(err)
     }
     fmt.Println("Temp dir created:", tempDirPath)

     // Create a file in new temp directory
     tempFile, err := ioutil.TempFile(tempDirPath, "myTempFile.txt")
     if err != nil {
          log.Fatal(err)
     }
     fmt.Println("Temp file created:", tempFile.Name())
     
     // ... do something with temp file/dir ...

     // Close file
     err = tempFile.Close()
     if err != nil {
        log.Fatal(err)
    }

    // Delete the resources we created
     err = os.Remove(tempFile.Name())
     if err != nil {
        log.Fatal(err)
    }
     err = os.Remove(tempDirPath)
     if err != nil {
        log.Fatal(err)
    }
}
```

## 5.2 从HTTP下载文件
```go
package main

import (
     "os"
     "io"
     "log"
     "net/http"
)

func main() {
     // Create output file
     newFile, err := os.Create("devdungeon.html")
     if err != nil {
          log.Fatal(err)
     }
     defer newFile.Close()

     // HTTP GET request devdungeon.com 
     url := "http://www.devdungeon.com/archive"
     response, err := http.Get(url)
     defer response.Body.Close()

     // Write bytes from HTTP response to file.
     // response.Body satisfies the reader interface.
     // newFile satisfies the writer interface.
     // That allows us to use io.Copy which accepts
     // any type that implements reader and writer interface
     numBytesWritten, err := io.Copy(newFile, response.Body)
     if err != nil {
          log.Fatal(err)
     }
     log.Printf("Downloaded %d byte file.\n", numBytesWritten)
}
```

## 5.3 哈希和摘要（Hashing和Checksums）
示例1
```go
package main

import (
    "crypto/md5"
    "crypto/sha1"
    "crypto/sha256"
    "crypto/sha512"
    "log"
    "fmt"
    "io/ioutil"
)

func main() {
    // Get bytes from file
    data, err := ioutil.ReadFile("test.txt")
    if err != nil {
        log.Fatal(err)
    }

    // Hash the file and output results
    fmt.Printf("Md5: %x\n\n", md5.Sum(data))
    fmt.Printf("Sha1: %x\n\n", sha1.Sum(data))
    fmt.Printf("Sha256: %x\n\n", sha256.Sum256(data))
    fmt.Printf("Sha512: %x\n\n", sha512.Sum512(data))
}
```

示例2
```go
package main

import (
    "crypto/md5"
    "log"
    "fmt"
    "io"
    "os"
)

func main() {
    // Open file for reading
    file, err := os.Open("test.txt")
    if err != nil {
        log.Fatal(err)
    }
    defer file.Close()
    
    // Create new hasher, which is a writer interface
    hasher := md5.New()
    _, err = io.Copy(hasher, file)
    if err != nil {
        log.Fatal(err)
    }

    // Hash and print. Pass nil since
    // the data is not coming in as a slice argument
    // but is coming through the writer interface
    sum := hasher.Sum(nil)
    fmt.Printf("Md5 checksum: %x\n", sum)
}
```

---
- 原文[Working with Files in Go](https://www.devdungeon.com/content/working-files-go)