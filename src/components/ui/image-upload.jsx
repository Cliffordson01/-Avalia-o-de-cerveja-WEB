import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, X, Image as ImageIcon, Camera } from 'lucide-react'

const ImageUpload = ({ 
  images = [], 
  onImagesChange, 
  maxImages = 5, 
  maxSizeMB = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  className = ""
}) => {
  const [dragActive, setDragActive] = useState(false)
  const [errors, setErrors] = useState([])
  const fileInputRef = useRef(null)

  const validateFile = (file) => {
    const errors = []
    
    // Verificar tipo
    if (!acceptedTypes.includes(file.type)) {
      errors.push(`${file.name}: Tipo de arquivo não suportado. Use JPG, PNG ou WebP.`)
    }
    
    // Verificar tamanho
    if (file.size > maxSizeMB * 1024 * 1024) {
      errors.push(`${file.name}: Arquivo muito grande. Máximo ${maxSizeMB}MB.`)
    }
    
    return errors
  }

  const handleFiles = (files) => {
    const fileArray = Array.from(files)
    const newErrors = []
    const validFiles = []

    // Verificar limite de imagens
    if (images.length + fileArray.length > maxImages) {
      newErrors.push(`Máximo de ${maxImages} imagens permitidas.`)
      setErrors(newErrors)
      return
    }

    // Validar cada arquivo
    fileArray.forEach(file => {
      const fileErrors = validateFile(file)
      if (fileErrors.length > 0) {
        newErrors.push(...fileErrors)
      } else {
        validFiles.push(file)
      }
    })

    setErrors(newErrors)

    if (validFiles.length > 0) {
      const updatedImages = [...images, ...validFiles]
      onImagesChange(updatedImages)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }

  const removeImage = (index) => {
    const updatedImages = images.filter((_, i) => i !== index)
    onImagesChange(updatedImages)
    setErrors([])
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
          dragActive 
            ? 'border-amber-500 bg-amber-50' 
            : 'border-amber-300 hover:border-amber-400 hover:bg-amber-25'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
        />
        
        <div className="space-y-4">
          <div className="flex justify-center">
            {dragActive ? (
              <Upload className="w-12 h-12 text-amber-500 animate-bounce" />
            ) : (
              <div className="flex space-x-2">
                <ImageIcon className="w-8 h-8 text-amber-600" />
                <Camera className="w-8 h-8 text-amber-600" />
              </div>
            )}
          </div>
          
          <div>
            <p className="text-lg font-medium text-amber-800 mb-2">
              {dragActive ? 'Solte as imagens aqui' : 'Adicionar imagens'}
            </p>
            <p className="text-sm text-amber-600">
              Arraste e solte ou clique para selecionar
            </p>
            <p className="text-xs text-amber-500 mt-2">
              Máximo {maxImages} imagens • {maxSizeMB}MB cada • JPG, PNG, WebP
            </p>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-red-800 font-medium mb-2">Erros encontrados:</h4>
          <ul className="text-red-700 text-sm space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-amber-800">
            Imagens selecionadas ({images.length}/{maxImages})
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <Card key={index} className="relative group overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-square relative">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Main Image Badge */}
                    {index === 0 && (
                      <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        Principal
                      </div>
                    )}
                    
                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    
                    {/* Image Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <p className="text-xs truncate">{image.name}</p>
                      <p className="text-xs text-gray-300">
                        {(image.size / 1024 / 1024).toFixed(1)}MB
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {images.length < maxImages && (
            <Button
              type="button"
              variant="outline"
              onClick={openFileDialog}
              className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              Adicionar mais imagens ({maxImages - images.length} restantes)
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default ImageUpload

