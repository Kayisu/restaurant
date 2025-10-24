import { Directive, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';

export interface DragDropConfig {
  accept?: string[];
  maxFiles?: number;
  maxSize?: number; // in bytes
  disabled?: boolean;
}

@Directive({
  selector: '[appDragDrop]',
  standalone: true
})
export class DragDropDirective {
  @Input() config: DragDropConfig = {};
  @Output() filesDropped = new EventEmitter<FileList>();
  @Output() filesInvalid = new EventEmitter<string[]>();

  private dragCounter = 0;

  constructor(private el: ElementRef) {}

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    if (this.config.disabled) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    this.el.nativeElement.classList.add('drag-over');
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent): void {
    if (this.config.disabled) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    this.dragCounter--;
    
    if (this.dragCounter === 0) {
      this.el.nativeElement.classList.remove('drag-over');
    }
  }

  @HostListener('dragenter', ['$event'])
  onDragEnter(event: DragEvent): void {
    if (this.config.disabled) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    this.dragCounter++;
    this.el.nativeElement.classList.add('drag-over');
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    if (this.config.disabled) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    this.dragCounter = 0;
    this.el.nativeElement.classList.remove('drag-over');
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.validateAndEmitFiles(files);
    }
  }

  @HostListener('click', ['$event'])
  onClick(event: Event): void {
    if (this.config.disabled) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = (this.config.maxFiles || 1) > 1;
    
    if (this.config.accept && this.config.accept.length > 0) {
      input.accept = this.config.accept.join(',');
    }
    
    input.onchange = (e: any) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        this.validateAndEmitFiles(files);
      }
    };
    
    input.click();
  }

  private validateAndEmitFiles(files: FileList): void {
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    // Check max files
    if (this.config.maxFiles && files.length > this.config.maxFiles) {
      invalidFiles.push(`Maximum ${this.config.maxFiles} files allowed`);
      this.filesInvalid.emit(invalidFiles);
      return;
    }

    // Validate each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let isValid = true;
      let errorMessage = '';

      // Check file type
      if (this.config.accept && this.config.accept.length > 0) {
        const fileType = file.type;
        const isAccepted = this.config.accept.some(acceptType => {
          if (acceptType.startsWith('.')) {
            return file.name.toLowerCase().endsWith(acceptType.toLowerCase());
          }
          return fileType === acceptType || fileType.startsWith(acceptType.split('/')[0] + '/');
        });

        if (!isAccepted) {
          isValid = false;
          errorMessage = `File type not allowed. Accepted: ${this.config.accept.join(', ')}`;
        }
      }

      // Check file size
      if (this.config.maxSize && file.size > this.config.maxSize) {
        isValid = false;
        const maxSizeMB = (this.config.maxSize / (1024 * 1024)).toFixed(1);
        errorMessage = `File too large. Maximum size: ${maxSizeMB}MB`;
      }

      if (isValid) {
        validFiles.push(file);
      } else {
        invalidFiles.push(`${file.name}: ${errorMessage}`);
      }
    }

    if (validFiles.length > 0) {
      this.filesDropped.emit(validFiles as any);
    }

    if (invalidFiles.length > 0) {
      this.filesInvalid.emit(invalidFiles);
    }
  }
}
